// src/services/gutenbergService.ts

import { debugLog } from '@/utils/debugLog';

// --- New HuggingFace Project Gutenberg Dataset Types ---
export interface HuggingFaceBook {
  id: number;          // Unique identifier
  title: string;       // Book title
  author: string;      // Book author
  text: string;        // Book content
  language: string;    // Language code
  subjects?: string[]; // Optional subjects
  bookshelves?: string[]; // Optional bookshelves
}

export interface HuggingFaceDatasetResponse {
  features: Record<string, { dtype: string; }>;
  rows: HuggingFaceBook[];
  num_rows: number;
}

export interface HuggingFaceSplitsResponse {
  splits: string[];
}

export interface HuggingFaceParquetFilesResponse {
  parquet_files: string[];
  safe_name?: string;
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
 * Maps bookshelf/category codes to bookshelf names.
 * Maps UI bookshelf IDs to bookshelf names.
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
 * Converts a bookshelf/category string (e.g. "bookshelf/480") to a bookshelf name.
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
 * Converts a century string (e.g. "15") to a year range.
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
 * Fetches the list of split names for the Project Gutenberg dataset.
 */
export async function fetchDatasetSplits(): Promise<string[]> {
  try {
    const url = "https://datasets-server.huggingface.co/splits?dataset=manu%2Fproject_gutenberg";
    debugLog("Fetching dataset splits from HuggingFace", { url });
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset splits: ${response.status}`);
    }
    
    const data: HuggingFaceSplitsResponse = await response.json();
    return data.splits;
  } catch (error) {
    console.error("Error fetching dataset splits:", error);
    return [];
  }
}

/**
 * Fetches the list of Parquet files for a specific split of the dataset.
 */
export async function fetchParquetFiles(split: string = "de"): Promise<string[]> {
  try {
    const url = `https://huggingface.co/api/datasets/manu/project_gutenberg/parquet/default/${split}`;
    debugLog("Fetching Parquet files from HuggingFace", { url, split });
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Parquet files: ${response.status}`);
    }
    
    const data: HuggingFaceParquetFilesResponse = await response.json();
    return data.parquet_files;
  } catch (error) {
    console.error("Error fetching Parquet files:", error);
    return [];
  }
}

import { searchLocalGutenbergBooks } from './localGutenbergService';

/**
 * Searches for books in the Project Gutenberg dataset matching the given criteria.
 * Uses the local dataset if available, otherwise falls back to the remote API.
 */
export async function searchGutenbergBooks(args: SearchGutenbergBooksArgs): Promise<HuggingFaceBook[]> {
  // Try local dataset first
  try {
    const localBooks = await searchLocalGutenbergBooks(args);
    if (localBooks && localBooks.length > 0) {
      debugLog("Using local Project Gutenberg dataset for search.");
      return localBooks;
    }
  } catch (localError) {
    debugLog("Local dataset access failed, falling back to HuggingFace API", { error: localError });
  }

  // Fallback to remote API
  try {
    const split = args.language === "de" ? "de" : "default";
    const offset = args.offset || 0;
    const length = args.limit || 100;
    const url = `https://datasets-server.huggingface.co/rows?dataset=manu%2Fproject_gutenberg&config=default&split=${split}&offset=${offset}&length=${length}`;
    debugLog("Searching Project Gutenberg dataset from HuggingFace", { 
      url, 
      split, 
      offset, 
      length,
      searchCriteria: args 
    });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }
    const data: HuggingFaceDatasetResponse = await response.json();
    let books = data.rows;

    // Apply filters based on search criteria (same as before)
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
      const range = centuryToYearRange(args.century);
      if (range) {
        const centuryNum = Math.floor(range.start / 100) + 1;
        const yearPrefix = Math.floor(range.start / 100);
        books = books.filter(book => {
          const centuryPatterns = [
            `${centuryNum}th century`,
            `${yearPrefix}00s`,
            `${range.start}s`,
            `${yearPrefix}00's`,
            `${yearPrefix}00-`,
            `${range.start}-`
          ];
          const inSubjects = book.subjects ? book.subjects.some(subj => {
            const lowerSubj = subj.toLowerCase();
            return centuryPatterns.some(pattern => lowerSubj.includes(pattern.toLowerCase()));
          }) : false;
          const inBookshelves = book.bookshelves ? book.bookshelves.some(shelf => {
            const lowerShelf = shelf.toLowerCase();
            return centuryPatterns.some(pattern => lowerShelf.includes(pattern.toLowerCase()));
          }) : false;
          return inSubjects || inBookshelves;
        });
      }
    }
    if (args.excludeIds && args.excludeIds.length > 0) {
      books = books.filter(book => !args.excludeIds!.includes(book.id));
    }
    return books;
  } catch (error) {
    console.error("Error searching Gutenberg books:", error);
    return [];
  }
}

/**
 * Gets the best available text content from a HuggingFace book.
 */
export function getBookText(book: HuggingFaceBook): string | null {
  return book.text || null;
}

/**
 * Gets the canonical URL for a Project Gutenberg book.
 */
export function getCanonicalGutenbergUrl(book: HuggingFaceBook): string | null {
  if (!book.id) return null;
  return `https://www.gutenberg.org/ebooks/${book.id}`;
}

/**
 * Fetches the text content of a book.
 */
export async function fetchBookText(book: HuggingFaceBook): Promise<string> {
  // The HuggingFace dataset already includes the text content
  return book.text || "";
}
