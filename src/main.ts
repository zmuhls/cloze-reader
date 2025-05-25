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
  enhanceSearchWithLLM,
  extractParagraphsFromMiddle, // Import from gutenbergService
  scoreParagraphQuality // Import from gutenbergService
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
// PassageData is now defined in gutenbergService.ts
import type { PassageData } from '@/services/gutenbergService';

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




/**
 * Fetches a passage from Project Gutenberg using Hugging Face dataset API.
 * This function now orchestrates calls to gutenbergService.ts.
 */
export async function fetchGutenbergPassage(
  category: string | null = null,
  author: string | null = null,
  century: string | null = null,
  initialAttemptedBookIds: number[] = []
): Promise<PassageData | null> {
  debugLog("Fetching Gutenberg passage via orchestrator", {
    category,
    author,
    century,
    initialAttemptedBookIds
  });

  // Use static fallback if forced
  if (FORCE_FALLBACK) {
    debugLog("Forced fallback mode enabled, using static examples");
    return getStaticFallbackPassage(category);
  }

  try {
    // Use the function from gutenbergService to get a random book
    const books = await searchGutenbergBooks({
      bookshelf: category ? parseBookshelf(category) : undefined,
      author: author || undefined,
      century: century || undefined,
      excludeIds: initialAttemptedBookIds,
      limit: 25, // Increased limit for better results
      language: 'en' // Default to English books
    });

    if (!books || books.length === 0) {
       debugLog("No books returned from searchGutenbergBooks");
       throw new Error("No books found matching criteria");
    }

    // Select a random book from the results
    const selectedBook = books[Math.floor(Math.random() * books.length)];

    debugLog("Selected book from search results", {
      id: selectedBook.id,
      title: selectedBook.title,
      author: selectedBook.author
    });

    // Get text content
    const bookText = getBookText(selectedBook);
    if (!bookText || bookText.length < 1000) {
      debugLog("Book text too short or empty", { id: selectedBook.id });
      throw new Error(`Book text too short or empty for book ID: ${selectedBook.id}`);
    }

    // Extract paragraphs using the function from gutenbergService
    const paragraphs = extractParagraphsFromMiddle(bookText);
    if (!paragraphs || paragraphs.length === 0) {
      debugLog("Failed to extract paragraphs from book text", { id: selectedBook.id });
      throw new Error(`Failed to extract paragraphs from book ID: ${selectedBook.id}`);
    }

    debugLog("Successfully extracted passage from dataset", {
      id: selectedBook.id,
      paragraphCount: paragraphs.length
    });

    // Return the passage data with metadata
    return {
      paragraphs,
      metadata: {
        title: selectedBook.title,
        author: selectedBook.author,
        id: typeof selectedBook.id === 'string' ? parseInt(selectedBook.id.replace(/\D/g, '')) || 0 : selectedBook.id,
        canonicalUrl: `https://www.gutenberg.org/ebooks/${selectedBook.id}`
      }
    };
  } catch (error) {
    console.error("Error fetching passage:", error);
    throw error; // Let the calling code handle the error (e.g., fall back to static)
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

// Note: DOM element caching and event listeners have been migrated to Preact component
// lifecycle in app.tsx and gameLogic.ts for better component-based architecture.

// Make functions globally available for legacy/debug purposes if absolutely necessary,
// but prefer component-based interactions.
if (typeof window !== 'undefined') {
    (window as any).fetchGutenbergPassage = fetchGutenbergPassage; // Expose for debugging or specific calls
    (window as any).startRound = gameLogicStartRound; // Already exposed in gameLogic, but can be here too
    console.log("MAIN.TS: Added global functions to window object for debugging.");
}
