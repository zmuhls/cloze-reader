// src/services/gutenbergService.ts

import { debugLog } from '@/utils/debugLog';

// --- Type Definitions (subset relevant to this service) ---
// Most Gutendex specific types can be removed as direct interaction is minimized.
// Retain any types if they are still used by other parts of the application,
// though it's likely they are not if all Gutenberg interactions are via LLM web search.

export interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string }[];
  formats: Record<string, string>; // This might still be useful if metadata parsing needs it.
}

// GutendexResponse, SearchGutenbergBooksArgs, GutendexBookDetails are likely no longer needed.

// All functions (searchGutenbergBooks, getGutenbergBookData, getGutenbergBookTextContent)
// are removed as their functionality is now handled by the web-enabled LLM
// in main.ts (fetchGutenbergPassage and findRelatedBooks).

// This file can be significantly simplified or even removed if no other part of the
// application directly uses any remaining Gutendex-specific logic or types.
// For now, keeping it minimal with potentially reusable types.

debugLog("Gutenberg Service: All direct fetch/tool functions have been removed. Operations are now handled by LLM web search.");
