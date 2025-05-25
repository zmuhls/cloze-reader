// src/services/gutenbergService.ts

import { debugLog } from '@/utils/debugLog';
import { 
  HuggingFaceBook, 
  SearchGutenbergBooksArgs,
  HuggingFaceDatasetResponse
} from './gutenbergTypes';
import { getEnvironmentConfig } from '@/utils/environmentConfig';
import { runAgenticLoop, OpenRouterMessage } from './llmService';

// Cache for dataset responses
const datasetCache = new Map<string, { data: HuggingFaceBook[], timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Maximum number of retries for API calls
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Helper function to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Searches for books in the Project Gutenberg dataset using Hugging Face Datasets Server API
 * See: https://huggingface.co/docs/datasets-server/rows
 */
export async function searchGutenbergBooks(args: SearchGutenbergBooksArgs): Promise<HuggingFaceBook[]> {
  try {
    // Generate cache key based on search criteria
    const cacheKey = JSON.stringify(args);
    const now = Date.now();
    const cached = datasetCache.get(cacheKey);

    // Return cached data if valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      debugLog("Using cached dataset results", { args });
      return cached.data;
    }

    // Construct Datasets Server API URL with query parameters
    const dataset = "manu/project_gutenberg";
    const config = "default";
    // Use the correct split based on language; default to "en"
    const validSplits = ["de", "en", "es", "fr", "it", "nl", "pl", "pt", "ru", "sv", "zh"];
    let split = "en";
    if (args.language && validSplits.includes(args.language)) {
      split = args.language;
    }
    const offset = args.offset || 0;
    const length = args.limit || 100;

    const params = new URLSearchParams({
      dataset,
      config,
      split,
      offset: offset.toString(),
      length: length.toString()
    });

    const url = `https://datasets-server.huggingface.co/rows?${params.toString()}`;

    let lastError: Error | null = null;
    let books: HuggingFaceBook[] = [];

    // Retry loop
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        debugLog(`Fetching from Hugging Face Datasets Server (attempt ${attempt}/${MAX_RETRIES})`, { url, args });
        const { HUGGINGFACE_API_KEY } = getEnvironmentConfig();
        // Try with API key first, then without if 401
        let headers: Record<string, string> = { 'Accept': 'application/json' };
        let response: Response | null = null;
        let triedWithoutAuth = false;

        for (let authAttempt = 0; authAttempt < 2; authAttempt++) {
          if (authAttempt === 0 && HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY.startsWith('hf_')) {
            headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
          } else if (authAttempt === 1) {
            delete headers['Authorization'];
            triedWithoutAuth = true;
          } else {
            continue;
          }

          response = await fetch(url, {
            method: 'GET',
            headers
          });

          if (response.status !== 401) break; // Only try without auth if 401
        }

        if (!response || !response.ok) {
          const errorBody = response ? await response.text() : 'No response';
          if (response && response.status === 500) {
            throw new Error(`Server error (500) on attempt ${attempt}: ${errorBody}`);
          }
          if (response && response.status === 401 && triedWithoutAuth) {
            throw new Error(
              `Failed to fetch books: 401 - The dataset may not be accessible via the Hugging Face Datasets Server API. ` +
              `It may require special permissions, or the Datasets Server may not support this dataset. ` +
              `Consider using the Python datasets library or downloading the data for local use.`
            );
          }
          throw new Error(`Failed to fetch books: ${response ? response.status : 'no status'} - ${errorBody}`);
        }

        const responseData = await response.json();
        debugLog("Raw API response:", responseData);

        // The rows are in responseData.rows, each with a .row property
        if (!responseData || !Array.isArray(responseData.rows)) {
          throw new Error(`Invalid response format: ${JSON.stringify(responseData)}`);
        }

        books = responseData.rows.map((r: any) => {
          const row = r.row;
          debugLog("Processing row:", row);
          
          // Based on the actual API response, extract title and author from text
          const text = row.text || '';
          const lines = text.split('\n');
          
          // Look for title in first few lines after "Project Gutenberg eBook"
          let title = 'Unknown Title';
          let author = 'Unknown Author';
          
          for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const line = lines[i].trim();
            if (line.startsWith('Title:')) {
              title = line.replace('Title:', '').trim();
            } else if (line.startsWith('Author:')) {
              author = line.replace('Author:', '').trim();
            }
          }
          
          return {
            id: row.id, // This is a string like "41496-8"
            title,
            author, 
            text,
            subjects: row.subjects || [],
            bookshelves: row.bookshelves || []
          };
        }).filter((book: any) =>
          book &&
          typeof book === 'object' &&
          book.id &&
          book.text &&
          book.title !== 'Unknown Title'
        );

        if (books.length === 0) {
          throw new Error('No books found in response');
        }

        debugLog(`Successfully fetched and validated data on attempt ${attempt}`, {
          totalBooks: books.length,
          sampleBook: books[0] ? {
            id: books[0].id,
            title: books[0].title,
            author: books[0].author
          } : null
        });

        break; // Exit retry loop on success
      } catch (error) {
        lastError = error as Error;
        debugLog(`API request failed on attempt ${attempt}`, {
          error: error.message,
          stack: error.stack,
          attempt,
          maxRetries: MAX_RETRIES
        });

        if (attempt < MAX_RETRIES) {
          const retryDelay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          debugLog(`Retrying in ${retryDelay}ms...`);
          await delay(retryDelay);
          continue;
        }
      }
    }

    // If we exhausted all retries and have no books, throw the last error or return empty array
    if (books.length === 0) {
      debugLog("No books from Hugging Face API after all retries");
      if (lastError) {
        throw lastError;
      }
      return [];
    }

    // Apply filters
    if (args.author) {
      const authorLower = args.author.toLowerCase();
      books = books.filter(book => book.author && book.author.toLowerCase().includes(authorLower));
    }

    if (args.bookshelf) {
      books = books.filter(book => {
        if (!book.bookshelves) return false;
        return book.bookshelves.some(shelf =>
          shelf.toLowerCase().includes(args.bookshelf!.toLowerCase())
        );
      });
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
      const centuryNum = parseInt(args.century);
      if (!isNaN(centuryNum)) {
        const yearPrefix = centuryNum - 1;
        const centuryPatterns = [
          `${centuryNum}th century`,
          `${yearPrefix}00s`,
          `${yearPrefix}00's`,
          `${yearPrefix}00-`
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

    // Cache the results
    datasetCache.set(cacheKey, { data: books, timestamp: now });
    debugLog("Successfully fetched and filtered books", { count: books.length });

    return books;
  } catch (error) {
    console.error("Error searching Gutenberg books:", error);
    return [];
  }
}

/**
 * Gets a random book from the dataset that matches the criteria
 */
export async function getRandomBook(args: SearchGutenbergBooksArgs): Promise<HuggingFaceBook | null> {
  const books = await searchGutenbergBooks(args);
  if (books.length === 0) return null;
  return books[Math.floor(Math.random() * books.length)];
}

/**
 * Gets a book by its ID from the dataset
 */
export async function getBookById(id: string | number): Promise<HuggingFaceBook | null> {
  const books = await searchGutenbergBooks({ 
    limit: 100, // Need larger limit to find specific ID
    excludeIds: [] 
  });
  return books.find(book => book.id === id || book.id.toString() === id.toString()) || null;
}

/**
 * Gets the text content of a book
 */
export function getBookText(book: HuggingFaceBook): string | null {
  return book.text || null;
}

/**
 * Uses LLM to enhance search results when needed
 */
export async function enhanceSearchWithLLM(books: HuggingFaceBook[], query: string): Promise<HuggingFaceBook[]> {
  if (!books || books.length === 0) return [];

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are a literary expert. Rank the relevance of books to this search: "${query}". 
                Return only book IDs in a JSON array, most relevant first. Example: [1234, 5678]`
    },
    {
      role: 'user',
      content: JSON.stringify(books.map(b => ({ 
        id: b.id, 
        title: b.title, 
        author: b.author,
        subjects: b.subjects,
        bookshelves: b.bookshelves
      })))
    }
  ];

  try {
    const response = await runAgenticLoop(messages, [], 0.2);
    if (!response) return books;

    const matches = response.match(/\[([\d,\s]+)\]/);
    if (!matches) return books;

    const rankedIds = matches[1].split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    // Reorder books based on LLM ranking
    const rankedBooks = [];
    for (const id of rankedIds) {
      const book = books.find(b => b.id === id);
      if (book) rankedBooks.push(book);
    }

    return rankedBooks.length > 0 ? rankedBooks : books;
  } catch (error) {
    debugLog("Error in LLM enhancement", { error });
    return books;
  }
}
