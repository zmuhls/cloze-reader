// src/services/gutenbergTypes.ts

// --- HuggingFace Dataset API Response Types ---
export interface HuggingFaceDatasetResponse {
  rows: HuggingFaceBook[];
  features: {
    [key: string]: {
      dtype: string;
      _type: string;
    };
  };
  num_rows: number;
  truncated: boolean;
}

// --- HuggingFace Project Gutenberg Dataset Types ---

export interface HuggingFaceBook {
  id: string | number; // Unique identifier (can be string like "41496-8" or number)
  title: string;       // Book title
  author: string;      // Book author
  text: string;        // Book content
  language?: string;   // Language code (optional)
  subjects?: string[]; // Optional subjects
  bookshelves?: string[]; // Optional bookshelves
}

export interface SearchGutenbergBooksArgs {
  bookshelf?: string; // e.g. "Science-Fiction"
  subject?: string;   // e.g. "Detective and mystery stories"
  author?: string;
  title?: string; // Added title for more specific searches
  century?: string;   // e.g. "19" for 19th century (UI might mean 20th, check logic)
  language?: string;  // e.g. "en"
  excludeIds?: (string | number)[]; // Exclude specific Gutenberg IDs
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
  // If it's not in "bookshelf/CODE" format, assume it's already a name or a direct query term
  // Check if it's a known code directly
  if (BOOKSHELF_ID_MAP[category]) {
    return BOOKSHELF_ID_MAP[category];
  }
  // Otherwise, return the category as is (could be a direct name like "Science Fiction")
  return category;
}

/**
 * Converts a century string (e.g. "19") to a year range.
 * In the UI, "19" refers to the 20th century (1900-1999).
 */
export function centuryToYearRange(century: string | null | undefined): { start: number, end: number } | undefined {
  if (!century) return undefined;
  const c = parseInt(century, 10);
  if (isNaN(c) || c < 0 || c > 21) { // Assuming centuries 0-21 (up to 2100s)
    console.warn("Invalid century input for centuryToYearRange:", { century });
    return undefined;
  }
  // UI "19" means 20th century (1900-1999)
  // UI "15" means 16th century (1500-1599)
  const startYear = c * 100;
  const endYear = startYear + 99;
  return { start: startYear, end: endYear };
}
