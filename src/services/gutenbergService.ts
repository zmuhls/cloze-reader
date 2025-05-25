// src/services/gutenbergService.ts

import { debugLog } from '@/utils/debugLog';
import {
  HuggingFaceBook,
  SearchGutenbergBooksArgs,
  HuggingFaceDatasetResponse
} from './gutenbergTypes';
import { getEnvironmentConfig } from '@/utils/environmentConfig';
import { runAgenticLoop, OpenRouterMessage, ToolDefinition } from './llmService';
import {
  ApiError,
  DataError,
  CacheError,
  handleApiError,
  handleDataError,
  logError
} from '@/utils/errorHandling';

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

    let lastError: unknown = null;
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

        // First try with API key if available
        if (HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY.startsWith('hf_')) {
          headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
          console.log("Using Hugging Face API key for authentication");
          
          response = await fetch(url, {
            method: 'GET',
            headers
          });
          
          // If we get a 401, we'll try again without auth
          if (response.status === 401) {
            console.log("Authentication failed with API key, trying without authentication");
            delete headers['Authorization'];
            triedWithoutAuth = true;
            
            response = await fetch(url, {
              method: 'GET',
              headers
            });
          }
        } else {
          // No valid API key, try without authentication
          console.log("No valid Hugging Face API key found, trying without authentication");
          triedWithoutAuth = true;
          
          response = await fetch(url, {
            method: 'GET',
            headers
          });
        }

        if (!response || !response.ok) {
          const errorBody = response ? await response.text() : 'No response';
          const status = response ? response.status : 0;
          
          if (status === 500) {
            throw new ApiError(`Server error (500) on attempt ${attempt}`, 500, url);
          }
          
          if (status === 401) {
            if (triedWithoutAuth) {
              console.error("Authentication failed even without API key. The dataset may require special permissions.");
              throw new ApiError(
                `The dataset may not be accessible via the Hugging Face Datasets Server API. ` +
                `It may require special permissions, or the Datasets Server may not support this dataset.`,
                401,
                url
              );
            } else {
              console.error("Authentication failed with API key. The API key may be invalid or expired.");
              throw new ApiError(
                `Authentication failed with the provided Hugging Face API key. ` +
                `The key may be invalid, expired, or not have the necessary permissions.`,
                401,
                url
              );
            }
          }
          
          throw new ApiError(`Failed to fetch books: ${errorBody}`, status, url);
        }

        const responseData = await response.json();
        debugLog("Raw API response:", responseData);

        // The rows are in responseData.rows, each with a .row property
        if (!responseData || !Array.isArray(responseData.rows)) {
          throw new DataError(`Invalid response format from Hugging Face API`, responseData);
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
          throw new DataError('No books found in response', responseData);
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
        lastError = error;
        
        // Log the error with our standardized error logging
        const errorObj = error instanceof Error
          ? error
          : new Error(typeof error === 'string' ? error : 'Unknown error');
        
        logError(
          errorObj,
          {
            attempt,
            maxRetries: MAX_RETRIES,
            url
          },
          'warn' // Use warn level since we're retrying
        );

        if (attempt < MAX_RETRIES) {
          const retryDelay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          debugLog(`Retrying in ${retryDelay}ms...`);
          await delay(retryDelay);
          continue;
        }
      }
    }

    // If we exhausted all retries and have no books, handle the error with our utility
    if (books.length === 0) {
      debugLog("No books from Hugging Face API after all retries");
      if (lastError) {
        return handleApiError(
          lastError,
          url,
          [] // Fallback to empty array
        );
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
    return handleApiError(
      error,
      'https://datasets-server.huggingface.co/rows',
      [] // Fallback to empty array
    );
  }
}

/**
 * Extracts 2-3 high-quality paragraphs from the middle of a book's text.
 * Improved with better content detection and text quality scoring.
 */
export function extractParagraphsFromMiddle(text: string): string[] {
  // Clean up the text more thoroughly
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Normalize excessive newlines
    .replace(/[^\S\n]+/g, ' ') // Normalize whitespace but preserve newlines
    .replace(/^\s+|\s+$/gm, ''); // Trim each line

  // Split into paragraphs
  const allParagraphs = cleanText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // If we don't have enough paragraphs, return empty array
  if (allParagraphs.length < 4) {
    return [];
  }

  // Enhanced filtering with quality scoring
  const contentParagraphs = allParagraphs
    .filter(p => {
      // Basic content filters
      const hasGutenbergContent = p.includes('Project Gutenberg') ||
        p.includes('www.gutenberg.org') ||
        p.includes('Produced by') ||
        p.includes('COPYRIGHT') ||
        p.includes('All rights reserved');

      const hasStructuralMarkers = p.match(/^\*\*\*/) ||
        p.match(/^\[/) ||
        p.includes('THE END') ||
        p.includes('THE BEGINNING') ||
        p.match(/^CHAPTER\s+[IVXLCDM\d]+/i) ||
        p.match(/^[IVXLCDM]+\.\s/) ||
        p.match(/^\d+\.\s/);

      const isMinimalContent = p.length < 80 || p.split(/\s+/).length < 15;

      // Check for dialogue-heavy content (less suitable for cloze)
      const quoteCount = (p.match(/"/g) || []).length;
      const isDialogueHeavy = quoteCount > 4;

      return !hasGutenbergContent && !hasStructuralMarkers && !isMinimalContent && !isDialogueHeavy;
    })
    .map(p => ({
      text: p,
      score: scoreParagraphQuality(p)
    }))
    .filter(p => p.score > 0.4) // Only keep decent-quality paragraphs
    .sort((a, b) => b.score - a.score); // Sort by quality

  // If we don't have enough paragraphs, return empty array
  if (contentParagraphs.length < 2) {
    return [];
  }

  // Take paragraphs from different sections to ensure variety
  const quarterPoint = Math.floor(contentParagraphs.length / 4);
  const midPoint = Math.floor(contentParagraphs.length / 2);
  const threeQuarterPoint = Math.floor(contentParagraphs.length * 3 / 4);

  const sections = [
    contentParagraphs.slice(quarterPoint, midPoint),
    contentParagraphs.slice(midPoint, threeQuarterPoint)
  ].filter(section => section.length > 0);

  const selectedParagraphs: string[] = [];

  // Pick one paragraph from each available section
  for (let i = 0; i < Math.min(2, sections.length); i++) {
    const section = sections[i];
    if (section.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, section.length)); // Pick from top 3 in section
      selectedParagraphs.push(section[randomIndex].text);
    }
  }

  return selectedParagraphs;
}

/**
 * Scores paragraph quality for cloze test suitability
 */
export function scoreParagraphQuality(paragraph: string): number {
  let score = 0.5; // Base score

  const words = paragraph.split(/\s+/);
  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Length scoring (optimal range)
  if (words.length >= 25 && words.length <= 60) {
    score += 0.2;
  } else if (words.length >= 20 && words.length <= 80) {
    score += 0.1;
  }

  // Sentence structure scoring
  if (sentences.length >= 2 && sentences.length <= 4) {
    score += 0.15;
  }

  // Vocabulary diversity
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
  const diversityRatio = uniqueWords.size / words.length;
  if (diversityRatio > 0.7) {
    score += 0.15;
  } else if (diversityRatio > 0.6) {
    score += 0.1;
  }

  // Penalize excessive punctuation or formatting
  const punctuationCount = (paragraph.match(/[^\w\s]/g) || []).length;
  const punctuationRatio = punctuationCount / paragraph.length;
  if (punctuationRatio > 0.1) {
    score -= 0.1;
  }

  // Prefer narrative prose over lists or fragmented text
  const hasNarrativeFlow = !paragraph.match(/^\s*[-\*\d]+\./m) &&
    !paragraph.includes('\n') &&
    sentences.length > 1;
  if (hasNarrativeFlow) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Gets a stochastic (random) selection of books and returns a random passage
 */
export async function getStochasticPassage(args: SearchGutenbergBooksArgs): Promise<{
  passage: string;
  book: HuggingFaceBook
} | null> {
  try {
    // Use a random offset to get different books each time
    const randomOffset = Math.floor(Math.random() * 1000);
    const searchArgs = {
      ...args,
      offset: randomOffset,
      limit: Math.max(args.limit || 50, 20) // Ensure we get enough books to choose from
    };

    const books = await searchGutenbergBooks(searchArgs);
    if (books.length === 0) return null;

    // Try multiple random books to find one with good content
    const maxAttempts = Math.min(10, books.length);
    const shuffledBooks = books.sort(() => Math.random() - 0.5);

    for (let i = 0; i < maxAttempts; i++) {
      const book = shuffledBooks[i];
      const passage = getRandomPassageFromBook(getBookText(book) || '');

      if (passage && passage.length >= 300) {
        return { passage, book };
      }
    }

    return null;
  } catch (error) {
    debugLog("Error in getStochasticPassage", { error });
    return null;
  }
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
    // Corrected argument: pass an empty array for tools
    const response = await runAgenticLoop(messages as OpenRouterMessage[], [] as ToolDefinition[], 0.2);
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

export interface PassageData {
  paragraphs: string[];
  metadata: {
    title: string;
    author: string;
    id: number;
    century?: string;
    canonicalUrl?: string;
    factoid?: string; // Add optional factoid
  } | null;
}
