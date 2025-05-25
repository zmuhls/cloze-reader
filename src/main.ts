// --- Constants and Config ---
// Flag to force fallback mode even with valid API key (for debugging)
const FORCE_FALLBACK = false; // Using the provided API key

import { debugLog } from '@/utils/debugLog';
// Import the environment configuration utilities
import { getEnvironmentConfig, isUsingUserProvidedApiKey } from '@/utils/environmentConfig';
// Import HuggingFace Project Gutenberg API functions and types
import { 
  searchGutenbergBooks, 
  getBookText,
  enhanceSearchWithLLM
} from '@/services/gutenbergService';
import { HuggingFaceBook, parseBookshelf, SearchGutenbergBooksArgs } from '@/services/gutenbergTypes'; // Moved types
import { runAgenticLoop, OpenRouterMessage } from '@/services/llmService';
// Import game logic functions and state, including startRound and handleSubmission
import { 
  initializeGameDOMElements, 
  resetGame as gameLogicResetGame, 
  startRound as gameLogicStartRound, 
  handleSubmission as gameLogicHandleSubmission
} from '@/services/gameLogic';


// --- Game Specific API Functions ---
// fetchGutenbergPassage is now exported for use in gameLogic.ts
export interface PassageData { // Exporting for gameLogic
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

/**
 * Get static fallback passages when API access is not available
 */
function getStaticFallbackPassage(category: string | null): PassageData {
  console.warn("Using fallback passage due to missing API key or forced fallback.");
  let fallbackParagraphs: string;
  let fallbackMetadata = { title: "Fallback Passage", author: "Anonymous", id: 0 };

  if (category === 'adventure') {
    fallbackParagraphs = `The intrepid explorer ventured deeper into the uncharted jungle, sweat beading on his brow as he hacked through the dense undergrowth with his machete. Strange bird calls echoed through the canopy above, and the air hung thick with moisture and the sweet scent of exotic flowers. He knew the lost temple lay somewhere ahead, its ancient stones hiding secrets that had remained untouched for centuries.

As night fell, he made camp beside a small stream, the gentle gurgling of water over stones providing a soothing counterpoint to the mysterious sounds of the jungle. His maps were worn and faded, but they had served him well thus far. Tomorrow would bring new challenges and, perhaps, the discovery that would cement his place in the annals of exploration.`;
    fallbackMetadata = { title: "Adventure Story Excerpt", author: "Various Authors", id: 0 };
  } else if (category === 'science') {
    fallbackParagraphs = `The laboratory hummed with the soft whirring of centrifuges and the occasional beep of monitoring equipment. Dr. Chen carefully pipetted the clear solution into a series of test tubes, her steady hands reflecting years of practiced precision. This experiment represented months of theoretical work, and if successful, could fundamentally alter our understanding of cellular regeneration.

Scientific discovery has always balanced on the knife-edge between methodical process and creative insight. The greatest breakthroughs often come not from following established protocols, but from the moments when researchers question fundamental assumptions and pursue the unexpected anomalies that appear in their data. It is this combination of discipline and imagination that drives progress forward.`;
    fallbackMetadata = { title: "Scientific Musings", author: "Various Authors", id: 0 };
  } else {
    // Default paragraphs for any other category or no category
    fallbackParagraphs = `The ability to think clearly and rationally is essential for making good decisions and solving problems effectively. Critical thinking involves analyzing information objectively and making reasoned judgments based on evidence rather than personal bias or emotional reactions. It requires skills such as attention to detail, logical reasoning, and the willingness to question assumptions.

Throughout history, literature has served as a mirror reflecting the values, concerns, and aspirations of society. Books allow us to experience different perspectives, fostering empathy and understanding across cultural divides. Whether through fiction or non-fiction, the written word preserves human knowledge and invites readers to engage with ideas that may challenge or expand their worldview.`;
    fallbackMetadata = { title: "General Knowledge Excerpt", author: "Various Authors", id: 0 };
  }

  return {
    paragraphs: fallbackParagraphs.split(/\n+/).filter(p => p.trim().length > 0),
    metadata: fallbackMetadata
  };
}

// Function removed - we only use Hugging Face dataset API

/**
 * Extracts 2-3 high-quality paragraphs from the middle of a book's text.
 * Improved with better content detection and text quality scoring.
 */
function extractParagraphsFromMiddle(text: string): string[] {
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
  if (allParagraphs.length < 8) {
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
        
      const isMinimalContent = p.length < 120 || p.split(/\s+/).length < 20;
      
      // Check for dialogue-heavy content (less suitable for cloze)
      const quoteCount = (p.match(/"/g) || []).length;
      const isDialogueHeavy = quoteCount > 4;
      
      return !hasGutenbergContent && !hasStructuralMarkers && !isMinimalContent && !isDialogueHeavy;
    })
    .map(p => ({
      text: p,
      score: scoreParagraphQuality(p)
    }))
    .filter(p => p.score > 0.6) // Only keep high-quality paragraphs
    .sort((a, b) => b.score - a.score); // Sort by quality
  
  // If we don't have enough high-quality paragraphs, return empty array
  if (contentParagraphs.length < 3) {
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
function scoreParagraphQuality(paragraph: string): number {
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
 * Fetches a passage from Project Gutenberg using Hugging Face dataset API.
 * This function exclusively uses the Hugging Face API and does not rely on any local data.
 */
export async function fetchGutenbergPassage(
  category: string | null = null,
  author: string | null = null,
  century: string | null = null,
  initialAttemptedBookIds: number[] = []
): Promise<PassageData | null> {
  debugLog("Fetching Gutenberg passage from Hugging Face dataset", { 
    category, 
    author, 
    century, 
    initialAttemptedBookIds,
    endpoint: "https://huggingface.co/api/datasets/manu/project_gutenberg/parquet/default"
  });

  // Use static fallback if forced
  if (FORCE_FALLBACK) {
    debugLog("Forced fallback mode enabled, using static examples");
    return getStaticFallbackPassage(category);
  }

  try {
    // Search for a book using only Hugging Face dataset
    const searchArgs: SearchGutenbergBooksArgs = {
      bookshelf: category ? parseBookshelf(category) : undefined,
      author: author || undefined,
      century: century || undefined,
      excludeIds: initialAttemptedBookIds,
      limit: 25, // Increased limit for better results
      language: 'en' // Default to English books
    };

    // Get books directly from Hugging Face dataset API with improved error handling
    let books = [];
    try {
      books = await searchGutenbergBooks(searchArgs);
      
      // Log some debug information about the response
      debugLog("Hugging Face API response", {
        booksReceived: books.length,
        firstBookTitle: books.length > 0 ? books[0].title : "No books found"
      });
      
      // If no books returned from the API, use static fallback
      if (!books || books.length === 0) {
        debugLog("No books returned from Hugging Face API, using fallback");
        return getStaticFallbackPassage(category);
      }
    } catch (error) {
      console.error("Error fetching books from Hugging Face API:", error);
      debugLog("API error details:", { 
        message: error instanceof Error ? error.message : String(error), 
        endpoint: "https://huggingface.co/api/datasets/manu/project_gutenberg/parquet/default" 
      });
      return getStaticFallbackPassage(category);
    }
    
    // If we have search criteria, try to enhance results with LLM
    const hasSearchCriteria = category || author || century;
    if (hasSearchCriteria && books.length > 0) {
      const criteria = [];
      if (author) criteria.push(`by ${author}`);
      if (category) criteria.push(`in category ${category}`);
      if (century) criteria.push(`from ${century}th century`);
      const query = criteria.join(' ');
      
      books = await enhanceSearchWithLLM(books, query);
    }

    // Get a random book from the results
    const book = books[Math.floor(Math.random() * books.length)];
    if (!book) {
      debugLog("No suitable book found in dataset");
      return getStaticFallbackPassage(category);
    }

    debugLog("Selected book from dataset", {
      id: book.id,
      title: book.title,
      author: book.author
    });

    // Get text content
    const bookText = getBookText(book);
    if (!bookText || bookText.length < 1000) {
      debugLog("Book text too short or empty", { id: book.id });
      return getStaticFallbackPassage(category);
    }

    // Extract paragraphs from the middle of the book
    const paragraphs = extractParagraphsFromMiddle(bookText);
    if (!paragraphs || paragraphs.length === 0) {
      debugLog("Failed to extract paragraphs from book text", { id: book.id });
      return getStaticFallbackPassage(category);
    }

    debugLog("Successfully extracted passage from dataset", {
      id: book.id,
      paragraphCount: paragraphs.length
    });

    // Return the passage data with metadata
    return {
      paragraphs,
      metadata: {
        title: book.title,
        author: book.author,
        id: typeof book.id === 'string' ? parseInt(book.id.replace(/\D/g, '')) || 0 : book.id,
        canonicalUrl: `https://www.gutenberg.org/ebooks/${book.id}`
      }
    };
  } catch (error) {
    console.error("Error fetching passage:", error);
    return getStaticFallbackPassage(category);
  }
}

// Function to reset game state for a new game (not just a new round)
function resetGame() {
  // We'll use the imported resetGame function from gameLogic
  gameLogicResetGame();

  // Additional UI updates if needed
  if (gameArea) gameArea.innerHTML = '';
  if (resultArea) resultArea.textContent = '';
  if (roundInfo) roundInfo.textContent = '';
  if (bibliographicArea) bibliographicArea.innerHTML = '';
  // Timer functionality removed
}

// Cache DOM elements
let bibliographicArea: HTMLElement | null = null, 
    gameArea: HTMLElement | null = null, 
    resultArea: HTMLElement | null = null, 
    hintBtn: HTMLButtonElement | null = null,
    submitBtn: HTMLButtonElement | null = null, 
    roundInfo: HTMLElement | null = null, 
    newTextBtn: HTMLButtonElement | null = null, 
    welcomeOverlay: HTMLElement | null = null, 
    startGameBtn: HTMLButtonElement | null = null, 
    settingsBtn: HTMLButtonElement | null = null;

function querySelectorSafe<T extends Element>(selector: string, container: Document | Element = document): T | null {
    const element = container.querySelector(selector);
    if (!element) {
        console.warn(`Element with selector "${selector}" not found.`);
        return null;
    }
    return element as T;
}

export function cacheDOMElements() {
    try {
        bibliographicArea = querySelectorSafe<HTMLElement>('#bibliographic-area');
        gameArea = querySelectorSafe<HTMLElement>('#game-area');
        resultArea = querySelectorSafe<HTMLElement>('#result');
        
        // Look specifically for the hint and submit buttons in the game-controls container
        hintBtn = querySelectorSafe<HTMLButtonElement>('#game-controls #hint-btn');
        submitBtn = querySelectorSafe<HTMLButtonElement>('#game-controls #submit-btn');
        
        roundInfo = querySelectorSafe<HTMLElement>('#round-info');
        
        // Settings elements are now handled by Preact components
        newTextBtn = querySelectorSafe<HTMLButtonElement>('#new-text-btn');
        settingsBtn = querySelectorSafe<HTMLButtonElement>('#settings-btn'); // Cache the settings button
        
        // Check for welcome overlay elements (may not exist in inference.html)
        welcomeOverlay = querySelectorSafe<HTMLElement>('#welcome-overlay');
        startGameBtn = querySelectorSafe<HTMLButtonElement>('#start-game-btn');
        
        console.log("DOM Elements cached successfully:", {
            gameAreaFound: !!document.querySelector('#game-area'),
            gameControlsFound: !!document.querySelector('#game-controls'),
            hintBtnFound: !!document.querySelector('#game-controls #hint-btn'),
            submitBtnFound: !!document.querySelector('#game-controls #submit-btn'),
            roundInfoFound: !!document.querySelector('#round-info'),
            welcomeOverlayFound: !!document.querySelector('#welcome-overlay'),
            startGameBtnFound: !!document.querySelector('#start-game-btn')
        });

        // Initialize DOM elements for gameLogic service
        initializeGameDOMElements({
            gameArea,
            roundInfo,
            submitBtn,
            hintBtn,
            resultArea,
            bibliographicArea
        });
    } catch (error) {
        console.error("Error caching DOM elements:", error);
    }
}

// Make functions globally available for legacy code and avoiding circular imports
if (typeof window !== 'undefined') {
    (window as any).startRound = gameLogicStartRound;
    // findRelatedBooks is removed
    console.log("Added global functions to window object");
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // DOM element caching and event listener attachment are now primarily handled by app.tsx
  // and gameLogic.ts after the WelcomeOverlay is dismissed.
  // The 'DOMContentLoaded' listener here can be simplified or removed if app.tsx handles all initial setup.

  // Log API access info for clarity - helpful for GitHub Pages deployment
  console.log("MAIN.TS: Application script loaded. Initialization will be handled by app.tsx.");

  // The cacheDOMElements and attachEventListeners functions are no longer strictly needed here
  // as app.tsx and its components manage their DOM interactions.
  // However, if there are any global, non-Preact elements that need early setup,
  // they could be handled here. For now, we assume Preact handles all relevant UI.
});

// Removed cacheDOMElements and attachEventListeners from main.ts
// as these are now more tightly coupled with Preact component lifecycle in app.tsx
// and gameLogic.ts for game-specific controls.

// Make functions globally available for legacy/debug purposes if absolutely necessary,
// but prefer component-based interactions.
if (typeof window !== 'undefined') {
    (window as any).fetchGutenbergPassage = fetchGutenbergPassage; // Expose for debugging or specific calls
    (window as any).startRound = gameLogicStartRound; // Already exposed in gameLogic, but can be here too
    console.log("MAIN.TS: Added global functions to window object for debugging.");
}
