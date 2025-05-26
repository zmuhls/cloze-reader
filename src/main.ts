// --- Constants and Config ---
import { debugLog } from '@/utils/debugLog';
import {
  initializeGameDOMElements,
  startRound as gameLogicStartRound
} from '@/services/gameLogic';
import { fetchGutenbergPassage as serviceFetchGutenbergPassage } from '@/services/gutenbergService';


// Function to reset game state for a new game (not just a new round)
function resetGame() {
  // Additional UI updates if needed
  if (gameArea) gameArea.innerHTML = '';
  if (resultArea) resultArea.textContent = '';
  if (roundInfo) roundInfo.textContent = '';
  if (bibliographicArea) bibliographicArea.innerHTML = '';
}

// Cache DOM elements
let bibliographicArea: HTMLElement | null = null, 
    gameArea: HTMLElement | null = null, 
    resultArea: HTMLElement | null = null, 
    hintBtn: HTMLButtonElement | null = null,
    submitBtn: HTMLButtonElement | null = null, 
    roundInfo: HTMLElement | null = null, 
    newTextBtn: HTMLButtonElement | null = null;

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
        
        newTextBtn = querySelectorSafe<HTMLButtonElement>('#new-text-btn');
        
        debugLog("DOM Elements cached successfully", {
            gameAreaFound: !!gameArea,
            hintBtnFound: !!hintBtn,
            submitBtnFound: !!submitBtn,
            roundInfoFound: !!roundInfo
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
  debugLog("Application script loaded. Initialization will be handled by app.tsx.");
});

// Make essential functions globally available
if (typeof window !== 'undefined') {
    (window as any).fetchGutenbergPassage = fetchGutenbergPassage;
    (window as any).startRound = gameLogicStartRound;
    debugLog("Global functions exposed for debugging");
}

export async function fetchGutenbergPassage(passageId: string): Promise<string | null> {
  // Assuming serviceFetchGutenbergPassage is imported from '@/services/gutenbergService'
  // and returns an object of type PassageData | null, where PassageData has paragraphs array.
  const passageData = await serviceFetchGutenbergPassage(passageId);
  if (passageData && passageData.paragraphs && passageData.paragraphs.length > 0) {
    return passageData.paragraphs.join('\n\n');
  }
  return null;
}
