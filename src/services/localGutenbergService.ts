// src/services/localGutenbergService.ts

import { 
  HuggingFaceBook, 
  SearchGutenbergBooksArgs, 
  parseBookshelf, 
  centuryToYearRange 
} from './gutenbergTypes';
import { debugLog } from '@/utils/debugLog';

// Cache for loaded dataset to avoid repeated file reads
let cachedDataset: HuggingFaceBook[] | null = null;
let lastLoadTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Loads the local Project Gutenberg dataset from JSON.
 * @param forceFresh Force a fresh load ignoring cache
 */
async function loadLocalDataset(forceFresh: boolean = false): Promise<HuggingFaceBook[]> {
  // Return cached dataset if available, not forcing refresh, and cache isn't expired
  const now = Date.now();
  if (!forceFresh && cachedDataset && cachedDataset.length > 0 && (now - lastLoadTime) < CACHE_DURATION) {
    debugLog("Using cached dataset", { bookCount: cachedDataset.length, cacheAge: (now - lastLoadTime) / 1000 });
    return cachedDataset;
  }

  // Function to safely parse JSON with better error handling
  const safeParseJson = async (response: Response): Promise<any> => {
    try {
      const text = await response.text();
      // Log the first 100 chars to help diagnose issues
      debugLog("Response content preview:", { preview: text.substring(0, 100) + "..." });
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        const error = parseError as Error;
        debugLog("JSON parse error:", { 
          errorMessage: error.message, 
          responseStart: text.substring(0, 200),
          responseContentType: response.headers.get("content-type")
        });
        throw new Error(`JSON parse error: ${error.message}`);
      }
    } catch (textError) {
      debugLog("Error reading response text:", textError);
      throw new Error("Failed to read response content");
    }
  };

  try {
    // Try loading the main dataset first
    debugLog("Loading local dataset from /data/gutenberg/default.json");
    
    try {
      const response = await fetch('/data/gutenberg/default.json');
      
      if (response.ok) {
        debugLog("Default JSON response received", {
          status: response.status,
          contentType: response.headers.get("content-type")
        });
        
        const data = await safeParseJson(response);
        
        if (Array.isArray(data) && data.length > 0) {
          cachedDataset = data;
          lastLoadTime = now;
          debugLog("Successfully loaded main dataset", { bookCount: data.length });
          return data;
        } else {
          debugLog("Default JSON has invalid format", {
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 'n/a',
            type: typeof data
          });
        }
      } else {
        debugLog("Failed to fetch default.json", {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (defaultError) {
      debugLog("Error loading default.json", { error: defaultError });
    }
    
    // If main dataset fails or is empty, try the sample dataset
    debugLog("Main dataset unavailable, trying sample dataset");
    
    try {
      const sampleResponse = await fetch('/data/gutenberg/sample.json');
      
      if (sampleResponse.ok) {
        debugLog("Sample JSON response received", {
          status: sampleResponse.status,
          contentType: sampleResponse.headers.get("content-type")
        });
        
        const data = await safeParseJson(sampleResponse);
        
        if (Array.isArray(data) && data.length > 0) {
          cachedDataset = data;
          lastLoadTime = now;
          debugLog("Successfully loaded sample dataset", { bookCount: data.length });
          return data;
        } else {
          debugLog("Sample JSON has invalid format", {
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 'n/a',
            type: typeof data
          });
        }
      } else {
        debugLog("Failed to fetch sample.json", {
          status: sampleResponse.status,
          statusText: sampleResponse.statusText
        });
      }
    } catch (sampleError) {
      debugLog("Error loading sample.json", { error: sampleError });
    }
    
    throw new Error("Failed to load any local dataset");
  } catch (error) {
    console.error("Error loading local dataset:", error);
    // If cache exists but is expired, use it as fallback
    if (cachedDataset && cachedDataset.length > 0) {
      debugLog("Using expired cache as fallback", { bookCount: cachedDataset.length });
      return cachedDataset;
    }
    
    // Create and return a minimal fallback dataset if all else fails
    debugLog("No dataset available, creating minimal fallback dataset");
    const fallbackDataset: HuggingFaceBook[] = [
      {
        id: 11,
        title: "Alice's Adventures in Wonderland",
        author: "Lewis Carroll",
        text: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'",
        language: "en",
        subjects: ["Fantasy"],
        bookshelves: ["Children's Literature"]
      }
    ];
    
    return fallbackDataset;
  }
}

/**
 * Gets a random book from the dataset that matches the criteria
 */
export async function getRandomBook(args: SearchGutenbergBooksArgs): Promise<HuggingFaceBook | null> {
  const books = await searchLocalGutenbergBooks(args);
  if (books.length === 0) return null;
  return books[Math.floor(Math.random() * books.length)];
}

/**
 * Gets a book by its ID from the local dataset
 */
export async function getBookById(id: number): Promise<HuggingFaceBook | null> {
  const books = await loadLocalDataset();
  return books.find(book => book.id === id) || null;
}

/**
 * Searches the local Project Gutenberg dataset.
 */
export async function searchLocalGutenbergBooks(args: SearchGutenbergBooksArgs): Promise<HuggingFaceBook[]> {
  let books = await loadLocalDataset();

  // Apply filters based on search criteria
  if (args.author) {
    const authorLower = args.author.toLowerCase();
    books = books.filter(book => book.author && book.author.toLowerCase().includes(authorLower));
  }

  if (args.bookshelf) {
    const bookshelfName = parseBookshelf(args.bookshelf);
    if (bookshelfName) {
      books = books.filter(book => {
        if (!book.bookshelves) return false;
        return book.bookshelves.some(shelf =>
          shelf.toLowerCase().includes(bookshelfName.toLowerCase())
        );
      });
    }
  }

  if (args.subject) {
    books = books.filter(book => {
      if (!book.subjects) return false;
      return book.subjects.some(subj =>
        subj.toLowerCase().includes(args.subject!.toLowerCase())
      );
    });
  }

  if (args.century) {
    const range = centuryToYearRange(args.century);
    if (range) {
      const centuryNum = Math.floor(range.start / 100) + 1;
      const yearPrefix = Math.floor(range.start / 100);
      const centuryPatterns = [
        `${centuryNum}th century`,
        `${yearPrefix}00s`,
        `${range.start}s`,
        `${yearPrefix}00's`,
        `${yearPrefix}00-`,
        `${range.start}-`
      ];
      
      books = books.filter(book => {
        const inSubjects = book.subjects?.some(subj => 
          centuryPatterns.some(pattern => 
            subj.toLowerCase().includes(pattern.toLowerCase())
          )
        ) || false;
        
        const inBookshelves = book.bookshelves?.some(shelf => 
          centuryPatterns.some(pattern => 
            shelf.toLowerCase().includes(pattern.toLowerCase())
          )
        ) || false;
        
        return inSubjects || inBookshelves;
      });
    }
  }

  if (args.excludeIds?.length) {
    books = books.filter(book => !args.excludeIds!.includes(book.id));
  }

  // Randomize results to prevent always returning the same books
  books = books.sort(() => Math.random() - 0.5);

  // Apply pagination if specified
  const offset = args.offset || 0;
  const limit = args.limit || 100;
  return books.slice(offset, offset + limit);
}

/**
 * Gets the text content of a book
 */
export function getBookText(book: HuggingFaceBook): string | null {
  return book.text || null;
}
