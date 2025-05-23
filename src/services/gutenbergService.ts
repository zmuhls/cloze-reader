// src/services/gutenbergService.ts

import { debugLog } from '@/utils/debugLog';

export interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean;
  formats: Record<string, string>;
  download_count: number;
}

export interface GutendexResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

export interface SearchGutenbergBooksArgs {
  bookshelf?: string; // e.g. "Science-Fiction"
  subject?: string;   // e.g. "Detective and mystery stories"
  author?: string;
  century?: string;   // e.g. "19" for 20th century
  language?: string;  // e.g. "en"
  excludeIds?: number[]; // Exclude specific Gutenberg IDs, including 485
  copyright?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Maps bookshelf/category codes to Gutendex bookshelf names.
 * Maps UI bookshelf IDs to Gutendex bookshelf names.
 */
export const BOOKSHELF_ID_MAP: Record<string, string> = {
  // These match the values in QueryOptions.tsx
  "466": "Philosophy & Ethics",
  "478": "Science (General)",
  "468": "Politics",
  "446": "History (General)",
  "458": "Literature",
  "460": "Music",
  "484": "Teaching & Education",
  "459": "Mathematics",
  "427": "Biographies",
  "486": "Fiction (General)",
  "480": "Science-Fiction & Fantasy",
  "433": "Crime/Mystery",
  "453": "Humour",
  "467": "Poetry", 
  "485": "Travel & Geography"
};

/**
 * Converts a bookshelf/category string (e.g. "bookshelf/480") to a Gutendex bookshelf name.
 */
export function parseBookshelf(category: string | null | undefined): string | undefined {
  if (!category) return undefined;
  if (category.startsWith("bookshelf/")) {
    const code = category.split("/")[1];
    return BOOKSHELF_ID_MAP[code] || undefined;
  }
  return category;
}

/**
 * Converts a century string (e.g. "15") to a Gutendex year range.
 * Note: In the UI, "15" refers to the 16th century (1500-1599).
 * This means we use the century number directly as the first two digits of the year.
 */
export function centuryToYearRange(century: string | null | undefined): { start: number, end: number } | undefined {
  if (!century) return undefined;
  const c = parseInt(century, 10);
  if (isNaN(c)) return undefined;
  // "15" means 16th century: 1500-1599
  const start = c * 100;
  const end = start + 99;
  return { start, end };
}

/**
 * Searches Gutendex for books matching the given criteria.
 * This function connects directly to the official Gutendex API endpoint.
 */
export async function searchGutenbergBooks(args: SearchGutenbergBooksArgs): Promise<GutendexBook[]> {
  const params: Record<string, string> = {};
  if (args.bookshelf) params.bookshelves = args.bookshelf;
  if (args.subject) params.subject = args.subject;
  if (args.author) params.author = args.author;
  if (args.language) params.languages = args.language;
  if (args.copyright !== undefined) params.copyright = args.copyright ? "true" : "false";
  if (args.limit) params.page_size = String(args.limit);
  if (args.offset) params.offset = String(args.offset);

  // Gutendex does not support direct year filtering, but we can filter results after fetching
  const url = `https://gutendex.com/books?${Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`;
  debugLog("Gutendex API search URL", url);

  // Log API connection information
  debugLog("Direct Gutendex API connection:", { 
    endpoint: "https://gutendex.com/books",
    params: params,
  });
  
  debugLog("Fetching from URL:", url); // Add logging for the URL being fetched
  const resp = await fetch(url);
  debugLog("Response status:", resp.status); // Log the response status
  if (!resp.ok) throw new Error(`Gutendex API error: ${resp.status}`);
  const data: GutendexResponse = await resp.json();

  let books = data.results;

  // Filter by century if needed
  if (args.century) {
    const range = centuryToYearRange(args.century);
    if (range) {
      // With our updated centuryToYearRange function, "15" maps to 1500s (16th century)
      // So we need to adjust the century number for textual patterns
      const centuryNum = Math.floor(range.start / 100) + 1; // Convert year to century number (e.g., 1500 -> 16th)
      const yearPrefix = Math.floor(range.start / 100); // Just the first 2 digits (e.g., 1500 -> 15)
      
      books = books.filter(book => {
        // Look for multiple patterns in subjects and bookshelves
        const centuryPatterns = [
          `${centuryNum}th century`, // e.g., "16th century" for 1500s
          `${yearPrefix}00s`,        // e.g., "1500s" 
          `${range.start}s`,         // e.g., "1500s"
          `${yearPrefix}00's`,       // e.g., "1500's"
          `${yearPrefix}00-`,        // e.g., "1500-" (for date ranges)
          `${range.start}-`          // e.g., "1500-" (for date ranges)
        ];
        
        // Check subjects array
        const inSubjects = book.subjects.some(subj => {
          const lowerSubj = subj.toLowerCase();
          return centuryPatterns.some(pattern => lowerSubj.includes(pattern.toLowerCase()));
        });
        
        // Check bookshelves array
        const inBookshelves = book.bookshelves.some(shelf => {
          const lowerShelf = shelf.toLowerCase();
          return centuryPatterns.some(pattern => lowerShelf.includes(pattern.toLowerCase()));
        });
        
        return inSubjects || inBookshelves;
      });
    }
  }

  // Exclude IDs if provided
  if (args.excludeIds && args.excludeIds.length > 0) {
    books = books.filter(book => !args.excludeIds!.includes(book.id));
  }

  return books;
}

/**
 * Gets the best available text URL for a Gutendex book.
 */
export function getBookTextUrl(book: GutendexBook): string | null {
  // Prefer HTML, then plain text
  const formats = book.formats;
  if (formats["text/html; charset=utf-8"]) return formats["text/html; charset=utf-8"];
  if (formats["text/html"]) return formats["text/html"];
  if (formats["text/plain; charset=utf-8"]) return formats["text/plain; charset=utf-8"];
  if (formats["text/plain"]) return formats["text/plain"];
  // Fallback: try any HTML or plain text
  for (const [key, url] of Object.entries(formats)) {
    if (key.startsWith("text/html")) return url;
    if (key.startsWith("text/plain")) return url;
  }
  return null;
}

/**
 * Extracts the canonical Gutenberg ebook URL from Gutendex format URLs.
 * This is more reliable than constructing URLs based on Gutendex's ID field.
 * 
 * @param book The Gutendex book object
 * @returns The canonical Gutenberg URL or null if it cannot be determined
 */
export function getCanonicalGutenbergUrl(book: GutendexBook): string | null {
  try {
    // Try to extract the canonical URL from any format URL
    const formats = book.formats || {};
    const formatKeys = Object.keys(formats);
    
    if (formatKeys.length === 0) return null;
    
    // Try formats in preferred order
    const formatPreference = [
      "text/html; charset=utf-8", 
      "text/html",
      "text/plain; charset=utf-8",
      "text/plain",
      "application/epub+zip"
    ];
    
    // First try preferred formats
    for (const format of formatPreference) {
      if (formats[format]) {
        const ebookId = extractEbookIdFromFormatUrl(formats[format]);
        if (ebookId) return `https://www.gutenberg.org/ebooks/${ebookId}`;
      }
    }
    
    // If preferred formats aren't available, try any format URL
    for (const key of formatKeys) {
      const ebookId = extractEbookIdFromFormatUrl(formats[key]);
      if (ebookId) return `https://www.gutenberg.org/ebooks/${ebookId}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting canonical URL:", error);
    return null;
  }
}

/**
 * Extracts the real ebook ID from a Gutendex format URL.
 * Examples:
 * - https://www.gutenberg.org/files/33848/33848-h/33848-h.htm → 33848
 * - https://www.gutenberg.org/ebooks/33848.html.images → 33848
 * - https://www.gutenberg.org/cache/epub/33848/pg33848.html → 33848
 */
function extractEbookIdFromFormatUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Match patterns in pathnames 
    
    // Pattern 1: /files/33848/...
    const filesMatch = urlObj.pathname.match(/\/files\/(\d+)\//);
    if (filesMatch && filesMatch[1]) return filesMatch[1];
    
    // Pattern 2: /ebooks/33848...
    const ebooksMatch = urlObj.pathname.match(/\/ebooks\/(\d+)(?:\.|\/)/);
    if (ebooksMatch && ebooksMatch[1]) return ebooksMatch[1];
    
    // Pattern 3: /cache/epub/33848/...
    const cacheMatch = urlObj.pathname.match(/\/cache\/epub\/(\d+)\//);
    if (cacheMatch && cacheMatch[1]) return cacheMatch[1];
    
    // Pattern 4: ...pg33848.html
    const pgMatch = urlObj.pathname.match(/pg(\d+)\./);
    if (pgMatch && pgMatch[1]) return pgMatch[1];
    
    return null;
  } catch (error) {
    console.error("Error parsing format URL:", error);
    return null;
  }
}

/**
 * Fetches the text content of a Gutendex book.
 */
export async function fetchBookText(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch book text: ${resp.status}`);
  return await resp.text();
}
