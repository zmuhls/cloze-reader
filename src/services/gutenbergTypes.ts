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

// --- Local Dataset Types ---
export interface LocalGutenbergBook {
  // For gutenberg_cleaned dataset
  etextno?: number;
  book_title?: string;
  author?: string;
  issued?: string;
  context?: string;
  
  // For gutenberg_fiction dataset
  book_id?: number;
  title?: string;
  author_gender?: string;
  author_birth_year?: number;
  author_death_year?: number;
  release_date?: string;
  pg_subjects?: string[];
  topics?: string[];
  text?: string;
  
  // For gutenberg-poetry-corpus dataset
  line?: string;
  gutenberg_id?: number;
  
  // Common fields
  id?: string | number;
}

// --- Local Dataset Configuration ---
export const LOCAL_DATASET_PATHS = {
  cleaned: '/data/gutenberg_cleaned/sample.json',
  fiction: '/data/gutenberg_fiction/sample.json',
  poetry: '/data/gutenberg-poetry-corpus/sample.json'
};

// Category to dataset type mapping
export const CATEGORY_TO_DATASET_MAP: Record<string, string> = {
  // Fiction categories
  "486": "fiction", // Fiction (General)
  "480": "fiction", // Science-Fiction & Fantasy  
  "433": "fiction", // Crime/Mystery
  
  // Poetry
  "467": "poetry", // Poetry
  
  // Everything else uses cleaned dataset
  "466": "cleaned", // Philosophy & Ethics
  "478": "cleaned", // Science (General)
  "468": "cleaned", // Politics
  "446": "cleaned", // History (General)
  "458": "cleaned", // Literature
  "460": "cleaned", // Music
  "484": "cleaned", // Teaching & Education
  "459": "cleaned", // Mathematics
  "427": "cleaned", // Biographies
  "453": "cleaned", // Humour
  "485": "cleaned"  // Travel & Geography
};

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
 * Converts a category to the appropriate local dataset type
 * @param category The category string (e.g. "bookshelf/486")
 * @returns The dataset type to use
 */
export function categoryToDatasetType(category: string | null): string {
  if (!category) return "cleaned";
  
  // Extract code if it's in the format "bookshelf/XXX"
  const code = category.startsWith("bookshelf/") 
    ? category.split("/")[1] 
    : category;
    
  return CATEGORY_TO_DATASET_MAP[code] || "cleaned";
}

/**
 * Transforms a local dataset book to HuggingFaceBook format
 * @param book The local book data
 * @param datasetType The type of dataset (cleaned, fiction, poetry)
 * @returns Transformed HuggingFaceBook object
 */
export function transformLocalBookToHuggingFace(book: LocalGutenbergBook, datasetType: string): HuggingFaceBook {
  switch (datasetType) {
    case 'fiction':
      return {
        id: book.book_id || book.id || Math.floor(Math.random() * 1000000),
        title: book.title || 'Unknown Title',
        author: book.author || 'Unknown Author',
        text: book.text || '',
        subjects: book.pg_subjects || [],
        bookshelves: book.topics || []
      };
    
    case 'cleaned':
      return {
        id: book.etextno || book.id || Math.floor(Math.random() * 1000000),
        title: book.book_title || 'Unknown Title',
        author: book.author || 'Unknown Author',
        text: book.context || '',
        subjects: [],
        bookshelves: []
      };
    
    case 'poetry':
      // For poetry corpus, we need to aggregate lines by gutenberg_id
      return {
        id: book.gutenberg_id || book.id || Math.floor(Math.random() * 1000000),
        title: 'Poetry Collection',
        author: 'Various Authors',
        text: book.line || '',
        subjects: ['Poetry'],
        bookshelves: ['Poetry']
      };
    
    default:
      return {
        id: book.id || Math.floor(Math.random() * 1000000),
        title: book.title || book.book_title || 'Unknown Title',
        author: book.author || 'Unknown Author',
        text: book.text || book.context || '',
        subjects: [],
        bookshelves: []
      };
  }
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
