// --- Constants and Config ---
// Flag to force fallback mode even with valid API key (for debugging)
const FORCE_FALLBACK = false; // Using the provided API key

// Empty stub functions for timer (since we're removing timer functionality)
function startTimer() {
  // Timer functionality removed
}

function stopTimer() {
  // Timer functionality removed
}

import { debugLog } from '@/utils/debugLog';
// Import the environment configuration utilities
import { getEnvironmentConfig, isUsingUserProvidedApiKey } from '@/utils/environmentConfig';
// getGutenbergBookData and GutendexBookDetails are no longer used here as metadata
// is fetched by the web-enabled LLM directly in fetchGutenbergPassage.
// Other Gutendex types like GutendexResponse, SearchGutenbergBooksArgs are not directly used in main.ts anymore.
// import { getGutenbergBookData, GutendexBookDetails } from '@/services/gutenbergService'; // This line is removed
import { runAgenticLoop, tools as llmTools, OpenRouterMessage, ToolDefinition } from '@/services/llmService';
// Import game logic functions and state, including startRound and handleSubmission
import { 
  chooseRedactions, extractKeyTerms, renderRound, initializeGameDOMElements, 
  paragraphsWords, redactedIndices, round as gameRound, blanksCount as gameBlanksCount, 
  hintsRemaining as gameHintsRemaining, hintedBlanks as gameHintedBlanks, 
  resetGame as gameLogicResetGame, 
  ParagraphCache, ParagraphCacheItem, 
  startRound as gameLogicStartRound, 
  handleSubmission as gameLogicHandleSubmission
} from '@/services/gameLogic';

// --- Type Definitions ---
// Local OpenRouterMessage, ToolCallFunction, ToolCall, ToolParameterProperty, ToolDefinition are removed.
// Local GutendexBook, GutendexResponse, SearchGutenbergBooksArgs are removed.
// ParagraphCacheItem and ParagraphCache are moved to gameLogic.ts

// LLM interaction logic (callLLM, getToolResponse, runAgenticLoop, tools array, TOOL_MAPPING)
// is now imported from llmService.ts or handled within it.
// The local logToolCall can be removed if not used elsewhere or can be kept if still needed for other debugging.
// For now, let's assume it's not needed as llmService has its own.

// --- Game Specific API Functions ---
// fetchGutenbergPassage is now exported for use in gameLogic.ts
interface PassageData {
  paragraphs: string[];
  metadata: {
    title: string;
    author: string;
    id: number;
    century?: string;
  } | null;
}

export async function fetchGutenbergPassage(
  category: string | null = null, 
  author: string | null = null,
  century: string | null = null,
  attemptedBookIds: number[] = [] // Keep track of books already tried
): Promise<PassageData | null> {
  const MAX_RETRIES = 3;
  debugLog("Fetching Gutenberg passage", { category, author, century, attempt: attemptedBookIds.length + 1 });

  // CHECK 1: Allow real Gutenberg fetching when possible
  // Only use fallback when necessary (GitHub Pages, missing API key)
  const TEMP_FORCE_FALLBACK = false; // Enable real Gutenberg fetching
  
  // Check for API key and environment
  const hasValidApiKey = Boolean(getEnvironmentConfig().OPENROUTER_API_KEY);
  const isUsingCustomKey = isUsingUserProvidedApiKey();
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  debugLog("Environment check", { 
    hasValidApiKey, 
    isUsingCustomKey,
    isGitHubPages, 
    hostname: window.location.hostname,
    apiKeyFormat: getEnvironmentConfig().OPENROUTER_API_KEY.substring(0, 8) + "...",
    forceFallback: FORCE_FALLBACK,
    tempForceFallback: TEMP_FORCE_FALLBACK
  });

  // Use hardcoded examples if:
  // - we're on GitHub Pages AND don't have a custom key, OR
  // - have no valid API key, OR
  // - if we're forcing fallback mode (useful for debugging), OR
  // - temporarily forcing fallback globally
  // This fallback logic should be outside the retry loop, as it's a global override.
  if (!hasValidApiKey || FORCE_FALLBACK || TEMP_FORCE_FALLBACK) {
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

  // Retry loop
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    debugLog(`Fetch attempt ${attempt + 1} of ${MAX_RETRIES}. Attempted IDs: ${attemptedBookIds.join(', ')}`);

    const queryParts = [];
    if (author) queryParts.push(`by author "${author}"`);
    
    if (category) {
      if (category.includes('/')) {
        const categoryCode = category.split('/')[1];
        if (categoryCode) {
          queryParts.push(`in the Gutenberg bookshelf ID "${categoryCode}"`);
          debugLog(`Using bookshelf ID "${categoryCode}" from category "${category}".`);
        } else {
          debugLog(`Could not extract bookshelf ID from category "${category}". Category will be ignored.`);
        }
      } else {
        queryParts.push(`in the category "${category}"`);
      }
    }

    if (century) {
      const centuryNumber = parseInt(century);
      if (!isNaN(centuryNumber)) {
          queryParts.push(`from the ${centuryNumber + 1}th century`);
      }
    }

    let queryString = queryParts.join(' ');
    let baseQueryInstruction: string;

    if (queryParts.length > 0) {
      baseQueryInstruction = `from Project Gutenberg ${queryString}`;
      debugLog("Specific criteria provided: using standard query string.");
    } else {
      // For the initial fetch when no user settings are provided,
      // use a more specific instruction to encourage true randomness and variety.
      baseQueryInstruction = "from a truly random book in classic literature, prioritizing high variety and diverse selections. Please try to pick something unexpected or less common to ensure a unique experience.";
      debugLog("No specific criteria: using new enhanced random query string for initial fetch.");
    }
    
    let retryInstructions = "";
    if (attempt > 0) {
      retryInstructions = ` This is attempt ${attempt + 1}. Please ensure you select a *different* book than previous attempts.`;
    }
    if (attemptedBookIds.length > 0) {
      retryInstructions += ` Avoid Project Gutenberg IDs: ${attemptedBookIds.join(', ')}.`;
    }
    
    const userQuery = `Please provide a short literary passage (2-3 paragraphs) from Project Gutenberg.
${baseQueryInstruction ? `Ideally, the passage should be ${baseQueryInstruction}.` : 'The passage can be from any classic literary work.'}
${retryInstructions}
Include the title, author, and Project Gutenberg ID if available.

Format suggestion:
Title: [Book Title]
Author: [Book Author]
ID: [Book ID]
Passage:
[The passage text]

If no passage can be found, please indicate that. Focus on returning a passage, even if all criteria cannot be perfectly met.`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: 'You are an assistant that helps find and display literary passages from Project Gutenberg. Please provide the passage text along with its title, author, and Project Gutenberg ID if available. Prioritize finding a passage, even if specific search criteria (like category, author, or century) are suggestions and cannot all be met. Avoid adding commentary or analysis not present in the original text.' },
      { role: 'user', content: userQuery }
    ];

    try {
      // Determine temperature: higher for purely random, default otherwise
      const temperature = (queryParts.length === 0) ? 1.2 : undefined;
      debugLog(`LLM call (attempt ${attempt + 1}) with temperature: ${temperature === undefined ? 'default' : temperature}`);
      const llmResponseContent = await runAgenticLoop(messages, [], temperature); 

      if (!llmResponseContent) {
        console.error(`LLM call (attempt ${attempt + 1}) returned no content.`);
        if (attempt === MAX_RETRIES - 1) return null; // Last attempt failed
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
        continue; // Next attempt
      }

      debugLog(`LLM Web Search Response for Passage (attempt ${attempt + 1}):`, llmResponseContent);

      let bookTitle = "Unknown Title";
      let bookAuthor = "Unknown Author";
      let bookId: number | null = null;
      let passageText = "";

      const titleMatch = llmResponseContent.match(/Title:\s*(.*)/i);
      if (titleMatch && titleMatch[1]) bookTitle = titleMatch[1].trim();

      const authorMatch = llmResponseContent.match(/Author:\s*(.*)/i);
      if (authorMatch && authorMatch[1]) bookAuthor = authorMatch[1].trim();

      const idMatch = llmResponseContent.match(/ID:\s*(\d+)/i);
      if (idMatch && idMatch[1]) bookId = parseInt(idMatch[1], 10);

      // Add bookId to attemptedBookIds if valid and not already present
      if (bookId !== null && !attemptedBookIds.includes(bookId)) {
        attemptedBookIds.push(bookId);
      }
      
      const passageMarker = "Passage:";
      const passageStartIndex = llmResponseContent.indexOf(passageMarker);

      if (passageStartIndex !== -1) {
        passageText = llmResponseContent.substring(passageStartIndex + passageMarker.length).trim();
      } else {
        let lastMetadataIndex = 0;
        if (titleMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (titleMatch.index || 0) + titleMatch[0].length);
        if (authorMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (authorMatch.index || 0) + authorMatch[0].length);
        if (idMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (idMatch.index || 0) + idMatch[0].length);
        if (lastMetadataIndex > 0 && lastMetadataIndex < llmResponseContent.length) {
          passageText = llmResponseContent.substring(lastMetadataIndex).trim();
        } else if (!titleMatch && !authorMatch && !idMatch) {
          passageText = llmResponseContent.trim();
          debugLog("No metadata markers found, assuming entire response is passage text.");
        }
      }
      
      if (!passageText || llmResponseContent.toLowerCase().includes("no suitable passage found")) {
          console.warn(`Attempt ${attempt + 1}: Could not extract passage text or LLM indicated no passage found.`);
          if (attempt === MAX_RETRIES - 1) return null; // Last attempt failed
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
          continue; // Next attempt
      }

      let paragraphs = passageText
        .split(/\n\s*\n/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 150 && !p.startsWith('Project Gutenberg') && !p.startsWith('***') && !p.includes('*** END OF ') && !p.startsWith('THE END') && !p.includes('www.gutenberg.org') && !/^\*+$/.test(p))
        .slice(0, 10);
      
      if (paragraphs.length < 2) {
        debugLog(`Attempt ${attempt + 1}: First parsing didn't yield enough paragraphs, trying alternative.`);
        paragraphs = passageText
          .replace(/\r\n/g, '\n')
          .split(/(?:\n\s*){2,}/)
          .map((p: string) => p.replace(/\n/g, ' ').trim())
          .filter((p: string) => p.length > 150 && !p.includes('Project Gutenberg'))
          .slice(0, 10);
      }
      
      paragraphs.sort((a, b) => {
        const scoreA = Math.min(a.length, 1000) - Math.max(0, 2000 - a.length) + (a.match(/[.!?][\s"']/) ? 200 : 0);
        const scoreB = Math.min(b.length, 1000) - Math.max(0, 2000 - b.length) + (b.match(/[.!?][\s"']/) ? 200 : 0);
        return scoreB - scoreA;
      });
      
      paragraphs = paragraphs.slice(0, 2);
      
      if (paragraphs.length === 0) {
        debugLog(`Attempt ${attempt + 1}: Failed to extract suitable paragraphs after all parsing attempts.`);
      }

      // If we have at least one good paragraph, proceed. Otherwise, retry.
      if (paragraphs.length > 0) { // Changed from paragraphs.length < 2 to paragraphs.length > 0 for success condition
        console.log(`Attempt ${attempt + 1}: Successfully extracted ${paragraphs.length} paragraphs.`);
        return {
          paragraphs: paragraphs,
          metadata: { 
            title: bookTitle,
            author: bookAuthor,
            id: bookId !== null ? bookId : 0 
          }
        };
      } else {
        console.warn(`Attempt ${attempt + 1}: Could only extract ${paragraphs.length} suitable paragraphs. Retrying if attempts remain.`);
        // No suitable paragraphs found in this attempt, loop will continue if attempts < MAX_RETRIES
      }

    } catch (error) {
      console.error(`Error in fetchGutenbergPassage (LLM web search, attempt ${attempt + 1}):`, error);
      // Loop will continue if attempts < MAX_RETRIES
    }
    if (attempt < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff might be better
    }
  } // End of retry loop

  console.error("Failed to fetch a suitable passage after all retries.");
  return null; // Indicate failure after all retries
}

// are now imported from and managed by gameLogic.ts.
// We use aliasing for round, blanksCount, hintsRemaining, hintedBlanks to avoid naming conflicts if needed,
// though direct usage of imported names is fine if there are no conflicts.

// Function to reset game state for a new game (not just a new round)
function resetGame() {
  // We'll use the imported resetGame function from gameLogic
  gameLogicResetGame();

  // Additional UI updates if needed
  if (gameArea) gameArea.innerHTML = '';
  if (resultArea) resultArea.textContent = '';
  if (roundInfo) roundInfo.textContent = '';
  if (bibliographicArea) bibliographicArea.innerHTML = '';
  stopTimer();
}

// Cache DOM elements
let bibliographicArea: HTMLElement, gameArea: HTMLElement, resultArea: HTMLElement, hintBtn: HTMLButtonElement,
    submitBtn: HTMLButtonElement, roundInfo: HTMLElement, newTextBtn: HTMLButtonElement, welcomeOverlay: HTMLElement, startGameBtn: HTMLButtonElement;

function querySelectorSafe<T extends Element>(selector: string, container: Document | Element = document): T | null {
    const element = container.querySelector(selector);
    if (!element) {
        console.warn(`Element with selector "${selector}" not found.`);
        return null;
    }
    return element as T;
}

function cacheDOMElements() {
    try {
        bibliographicArea = querySelectorSafe<HTMLElement>('#bibliographic-area') || document.createElement('div');
        gameArea = querySelectorSafe<HTMLElement>('#game-area') || document.createElement('div');
        resultArea = querySelectorSafe<HTMLElement>('#result') || document.createElement('div');
        hintBtn = querySelectorSafe<HTMLButtonElement>('#hint-btn') || document.createElement('button');
        submitBtn = querySelectorSafe<HTMLButtonElement>('#submit-btn') || document.createElement('button');
        roundInfo = querySelectorSafe<HTMLElement>('#round-info') || document.createElement('div');
        
        // Settings elements are now handled by Preact components
        newTextBtn = querySelectorSafe<HTMLButtonElement>('#new-text-btn') || document.createElement('button');
        
        // Check for welcome overlay elements (may not exist in inference.html)
        welcomeOverlay = querySelectorSafe<HTMLElement>('#welcome-overlay') || document.createElement('div');
        startGameBtn = querySelectorSafe<HTMLButtonElement>('#start-game-btn') || document.createElement('button');
        
        console.log("DOM Elements cached successfully:", {
            gameAreaFound: !!document.querySelector('#game-area'),
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
    // Cache DOM elements
    cacheDOMElements();

    // Set up event listeners
    // The startGameBtn event listener is removed from here as it's handled by the WelcomeOverlay component's onStart prop
    // and the app.tsx component.

    newTextBtn.addEventListener('click', async () => {
      // Fetch a new passage without resetting game state, forcing a new passage
      await gameLogicStartRound(true);
    });
    submitBtn.addEventListener('click', () => gameLogicHandleSubmission());
    
    // Show welcome overlay
    // The welcome overlay visibility is now primarily managed by the App component's state
    // and the WelcomeOverlay component itself.
    // However, ensuring it's initially visible if not handled by Preact's initial render might still be useful.
    // For now, let's assume Preact handles initial visibility correctly.
    // If issues arise, we might need to revisit this.
    // welcomeOverlay.classList.remove('hidden'); // This line can likely be removed or conditionalized
});
