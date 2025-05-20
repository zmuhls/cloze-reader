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
  } | null;
}

export async function fetchGutenbergPassage(category: string | null = null, author: string | null = null): Promise<PassageData | null> {
  debugLog("Fetching Gutenberg passage", { category, author });
  
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
  if ((isGitHubPages && !isUsingCustomKey) || !hasValidApiKey || FORCE_FALLBACK || TEMP_FORCE_FALLBACK) {
    console.warn("Using fallback passage due to environment or missing API key.");
    // Return category-specific examples if possible
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

  // Simplified approach: Use a single LLM call with web search enabled.
  // The LLM will be prompted to find a passage and its metadata.
  const queryParts = [];
  if (author) queryParts.push(`by author "${author}"`);
  if (category) queryParts.push(`in the category "${category}"`);
  if (queryParts.length === 0) queryParts.push('from classic literature');

  const userQuery = `Find a suitable short passage (around 2-4 paragraphs) from Project Gutenberg ${queryParts.join(' ')}.
Provide ONLY the exact passage text from the book without any commentary, explanation or analysis. Also, provide the title, author, and Project Gutenberg ID.

Format your response STRICTLY as follows:
Title: [Book Title]
Author: [Book Author]
ID: [Book ID]
Passage:
[Paragraph 1]

[Paragraph 2]

IMPORTANT INSTRUCTIONS:
1. Do not include any explanation or commentary about the passage.
2. Do not introduce the passage or explain its significance.
3. Do not add any conclusion or remarks after the passage.
4. Only provide the exact text from the book in the format specified above.
5. The response should contain only metadata and exact text from the book.
6. EXCLUDE any paratextual material, metadata, headers, footers, license information, or introductory/concluding Project Gutenberg text. Provide ONLY the core literary passage.`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: 'You are a text extraction tool that retrieves exact passages from Project Gutenberg. Your task is to find and display literary passages without adding any analysis, commentary, explanations, or paratextual material. Present only the original text in the specified format.' },
    { role: 'user', content: userQuery }
  ];

  try {
    // No specific tools are passed; relying on the :online model's web search.
    // llmTools is not passed to runAgenticLoop, so it will use the default behavior (no tools or web search via :online)
    const llmResponseContent = await runAgenticLoop(messages, []); 

    if (!llmResponseContent) {
      console.error("LLM call for passage search returned no content.");
      return null;
    }

    debugLog("LLM Web Search Response for Passage:", llmResponseContent);

    // Parse the LLM's response to extract title, author, ID, and passage.
    let bookTitle = "Unknown Title";
    let bookAuthor = "Unknown Author";
    let bookId: number | null = null;
    let passageText = ""; // Renamed from fullText to avoid confusion with the old variable

    const titleMatch = llmResponseContent.match(/Title:\s*(.*)/i);
    if (titleMatch && titleMatch[1]) bookTitle = titleMatch[1].trim();

    const authorMatch = llmResponseContent.match(/Author:\s*(.*)/i);
    if (authorMatch && authorMatch[1]) bookAuthor = authorMatch[1].trim();

    const idMatch = llmResponseContent.match(/ID:\s*(\d+)/i);
    if (idMatch && idMatch[1]) bookId = parseInt(idMatch[1], 10);

    const passageMarker = "Passage:";
    const passageStartIndex = llmResponseContent.indexOf(passageMarker);

    if (passageStartIndex !== -1) {
      passageText = llmResponseContent.substring(passageStartIndex + passageMarker.length).trim();
    } else {
      // Fallback: if "Passage:" marker is not found, try to infer passage from content after metadata.
      // This is a rough heuristic.
      let lastMetadataIndex = 0;
      if (titleMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (titleMatch.index || 0) + titleMatch[0].length);
      if (authorMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (authorMatch.index || 0) + authorMatch[0].length);
      if (idMatch) lastMetadataIndex = Math.max(lastMetadataIndex, (idMatch.index || 0) + idMatch[0].length);
      
      if (lastMetadataIndex > 0 && lastMetadataIndex < llmResponseContent.length) {
        passageText = llmResponseContent.substring(lastMetadataIndex).trim();
      } else if (!titleMatch && !authorMatch && !idMatch) {
        // If no metadata found at all, assume the whole response is the passage.
        passageText = llmResponseContent.trim();
        debugLog("No metadata markers found, assuming entire response is passage text.");
      }
    }
    
    if (!passageText) {
        console.error("Could not extract passage text from LLM response.");
        // Check if the LLM indicated no passage was found
        if (llmResponseContent.toLowerCase().includes("no suitable passage") || llmResponseContent.toLowerCase().includes("could not find")) {
            debugLog("LLM indicated no passage found.");
        }
        return null;
    }

    // Process the extracted passageText into paragraphs
    try {
      let paragraphs = passageText
        .split(/\n\s*\n/) // Split by one or more empty lines
        .map((p: string) => p.trim())
        .filter((p: string) => {
          // More comprehensive filtering logic
          return p.length > 200 && 
                !p.startsWith('Project Gutenberg') && 
                !p.startsWith('***') && 
                !p.includes('*** END OF ') &&
                !p.startsWith('THE END') && 
                !p.includes('www.gutenberg.org') &&
                !/^\*+$/.test(p); // Exclude lines that are just asterisks
        })
        .slice(0, 10); // Take first 10 candidates to have a better selection pool
      
      // If we didn't get enough paragraphs, try alternative parsing approach
      if (paragraphs.length < 2) {
        debugLog("First parsing attempt didn't yield enough paragraphs, trying alternative approach");
        // Alternative approach: extract larger sections and split them
        paragraphs = passageText // Changed fullText to passageText
          .replace(/\r\n/g, '\n')
          .split(/(?:\n\s*){2,}/)
          .map((p: string) => p.replace(/\n/g, ' ').trim())
          .filter((p: string) => p.length > 200 && !p.includes('Project Gutenberg'))
          .slice(0, 10);
      }
      
      // Sort paragraphs by quality (prefer mid-length paragraphs that aren't too long or too short)
      paragraphs.sort((a, b) => {
        // Score is based on:
        // 1. Penalty for short paragraphs
        // 2. Penalty for extremely long paragraphs
        // 3. Preference for paragraphs with proper punctuation
        const scoreA = Math.min(a.length, 1000) - Math.max(0, 2000 - a.length) + (a.match(/[.!?][\s"']/) ? 200 : 0);
        const scoreB = Math.min(b.length, 1000) - Math.max(0, 2000 - b.length) + (b.match(/[.!?][\s"']/) ? 200 : 0);
        return scoreB - scoreA;
      });
      
      // Take the top 2 paragraphs
      paragraphs = paragraphs.slice(0, 2);
      
      // Final check to ensure paragraphs are suitable
      if (paragraphs.length === 0) {
        debugLog("Failed to extract suitable paragraphs, falling back to text chunks");
        // Last resort: Just take chunks of the text if nothing else worked
        const chunks = passageText.match(/.{200,800}[.!?]/g) || []; // Changed fullText to passageText
        paragraphs = chunks.slice(0, 2);
      }

      if (paragraphs.length < 2) {
          console.warn(`Could only extract ${paragraphs.length} suitable paragraphs from LLM response. Trying another book or falling back?`); // Updated log message
          // For now, just return what we have or null if not enough
          if (paragraphs.length === 0) return null;
      }

      console.log(`Successfully extracted ${paragraphs.length} paragraphs from LLM web search.`);

      return {
        paragraphs: paragraphs,
        metadata: { 
          title: bookTitle,
          author: bookAuthor,
          id: bookId !== null ? bookId : 0 // Use 0 if ID is null
        }
      };
    } catch (error) {
      console.error(`Error processing text content from LLM web search:`, error);
      return null;
    }

  } catch (error) { // This outer catch handles errors from the initial book search LLM call
    console.error('Error in fetchGutenbergPassage (LLM web search):', error);
    return null; // Indicate failure
  }
}


// --- Game State & DOM Elements ---
// Game state variables (paragraphsWords, redactedIndices, round, blanksCount, hintsRemaining, hintedBlanks)
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
