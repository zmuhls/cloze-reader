// src/services/localGutenbergService.ts

import { HuggingFaceBook, SearchGutenbergBooksArgs, parseBookshelf, centuryToYearRange } from './gutenbergService';
import { debugLog } from '@/utils/debugLog';

// Cache for loaded dataset to avoid repeated file reads
let cachedDataset: HuggingFaceBook[] = [];

/**
 * Loads the local Project Gutenberg dataset from JSON.
 * @param split Dataset split (default: 'default')
 */
async function loadLocalDataset(split: string = 'default'): Promise<HuggingFaceBook[]> {
  if (cachedDataset.length > 0) return cachedDataset;

  try {
    // For Vite/Parcel, public assets are served from /public, so adjust path if needed
    const response = await fetch('/data/gutenberg/default.json');
    if (!response.ok) {
      throw new Error(`Failed to load local dataset: ${response.status}`);
    }
    cachedDataset = await response.json();
    return cachedDataset;
  } catch (error) {
    console.error("Error loading local dataset:", error);
    return [];
  }
}

/**
 * Searches the local Project Gutenberg dataset using the same logic as the remote API.
 */
export async function searchLocalGutenbergBooks(args: SearchGutenbergBooksArgs): Promise<HuggingFaceBook[]> {
  const split = args.language === "de" ? "de" : "default";
  let books = await loadLocalDataset(split);

  // Apply filters based on search criteria
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

  // Filter by century if needed
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

  // Exclude IDs if provided
  if (args.excludeIds && args.excludeIds.length > 0) {
    books = books.filter(book => !args.excludeIds!.includes(book.id));
  }

  // Pagination
  const offset = args.offset || 0;
  const limit = args.limit || 100;
  return books.slice(offset, offset + limit);
}
