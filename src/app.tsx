import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { SettingsFooter } from './components/settings/SettingsFooter';
import { WelcomeOverlay } from './components/welcome/WelcomeOverlay';
import { apiKeySignal } from './components/settings/ApiConfiguration';
import { categorySignal, authorSignal, centurySignal } from './components/settings/QueryOptions';
import { startRound, isDOMElementsInitialized } from './services/gameLogic'; // Import isDOMElementsInitialized
import { cacheDOMElements } from './main'; // Import cacheDOMElements

console.log("APP.TSX: Script loading");

// Determine if this is a remote interface (GitHub Pages)
const isRemoteInterface = window.location.hostname.includes('github.io');

// Function to start the game round 
const startGameRound = (forceNewPassage = true) => {
  console.log("APP.TSX: startGameRound called", { forceNewPassage });
  
  // Show loading state in the game area
  const gameArea = document.getElementById('game-area');
  if (gameArea) {
    gameArea.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8" aria-live="polite">
        <p class="text-lg mb-3">Fetching new passage...</p>
        <p class="text-sm opacity-70 mb-4">*click* *clack* *ding*</p>
        <div role="status" aria-label="Loading passage" class="relative h-2 w-48 bg-aged-paper-dark overflow-hidden rounded-full">
          <div class="absolute top-0 left-0 h-full bg-typewriter-ribbon animate-pulse rounded-full" style="width: 30%"></div>
        </div>
      </div>
    `;
  }
  
  // Wait for DOM elements to be initialized in gameLogic before starting the round
  const waitForDOMElements = (callback: () => void, timeout = 5000, interval = 50) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isDOMElementsInitialized) {
        clearInterval(checkInterval);
        callback();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.error("Timeout waiting for DOM elements to be initialized.");
        // Show error state if timeout occurs
        if (gameArea) {
          gameArea.innerHTML = `
            <div class="p-6" aria-live="assertive">
              <p class="text-lg text-red-600 mb-2">Initialization Error</p>
              <p class="mb-4">Could not initialize game elements. Please refresh the page.</p>
            </div>
          `;
        }
      }
    }, interval);
  };

  // Call startRound from gameLogic.ts after waiting for DOM elements
  waitForDOMElements(() => {
    try {
      // Use the imported startRound directly
      startRound(forceNewPassage);
      console.log("APP.TSX: startRound call completed successfully");
      console.log("Game area:", gameArea); // Log the game area element
    
    // Set a timeout to check if the game area still shows an error message
    setTimeout(() => {
      const gameArea = document.getElementById('game-area');
      if (gameArea && gameArea.innerHTML.includes('Failed to fetch a passage')) {
        console.log("Detected 'Failed to fetch' message, attempting secondary rendering");
        
        // Look for title and author data
        const bibliographicArea = document.getElementById('bibliographic-area');
        if (bibliographicArea) {
          const title = bibliographicArea.querySelector('h2')?.textContent || 'Unknown Title';
          const author = bibliographicArea.querySelector('p')?.textContent?.replace('By ', '') || 'Unknown Author';
          
          // If we have metadata but no passage text, try to rerender
          if (title !== 'Unknown Title' || author !== 'Unknown Author') {
            gameArea.innerHTML = `
              <div class="p-6">
                <p class="text-lg mb-4">The passage text will be displayed here.</p>
                <p class="text-sm mb-2">Click the "Retry" button below to attempt to fetch the text again.</p>
                <button 
                  id="retry-btn" 
                  class="px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 focus:ring-2 focus:ring-typewriter-ribbon focus:outline-none"
                  onclick="window.startRound(true)"
                >
                  Retry
                </button>
              </div>
            `;
          }
        }
      }
    }, 3000); // Check after 3 seconds
  } catch (error) {
    console.error("APP.TSX: Error in startRound:", error);
    
    // Show error state in the game area
    if (gameArea) {
      gameArea.innerHTML = `
        <div class="p-6" aria-live="assertive">
          <p class="text-lg text-red-600 mb-2">Oops! We couldn't fetch a passage.</p>
          <p class="mb-4">Please try again later or check your connection.</p>
          <button 
            id="retry-btn" 
            class="px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 focus:ring-2 focus:ring-typewriter-ribbon focus:outline-none"
            onclick="window.startRound(true)"
          >
            Try Again
          </button>
        </div>
      `;
    }
  }
  }); // Closing parenthesis and semicolon for waitForDOMElements call
}; // Closing brace for startGameRound function

// Main application component
const App = () => {
  // Always show welcome overlay initially
  const [showWelcome, setShowWelcome] = useState(true);
  // isFirstLoad and the related useEffect are no longer needed as welcome is always shown first
  // const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Cache DOM elements after initial render
  // (REMOVED: now called after welcome overlay is dismissed)

  // Listen to settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      // Log settings changes
      console.log("Settings changed:", {
        apiKey: apiKeySignal.value ? "Key set" : "No key",
        category: categorySignal.value,
        author: authorSignal.value,
        century: centurySignal.value
      });
    };
    
    // Set up listeners for signals
    const unsubscribeApiKey = apiKeySignal.subscribe(handleSettingsChange);
    const unsubscribeCategory = categorySignal.subscribe(handleSettingsChange);
    const unsubscribeAuthor = authorSignal.subscribe(handleSettingsChange);
    const unsubscribeCentury = centurySignal.subscribe(handleSettingsChange);
    
    return () => {
      unsubscribeApiKey();
      unsubscribeCategory();
      unsubscribeAuthor();
      unsubscribeCentury();
    };
  }, []);
  
  const handleWelcomeStart = () => {
    setShowWelcome(false);
    // Wait for game controls to appear, then initialize
    const requiredSelectors = [
      "#game-controls",
      "#game-controls #hint-btn",
      "#game-controls #submit-btn",
      "#round-info",
      "#result"
    ];
    const checkElements = () => requiredSelectors.every(sel => document.querySelector(sel));
    const tryInit = () => {
      cacheDOMElements();
      startGameRound(true);
    };
    if (checkElements()) {
      tryInit();
      return;
    }
    const observer = new MutationObserver(() => {
      if (checkElements()) {
        observer.disconnect();
        tryInit();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // When welcome overlay is dismissed, initialize DOM elements and start the game
  // (REMOVED: now handled in handleWelcomeStart)

  return (
    <>
      {showWelcome && <WelcomeOverlay onStart={handleWelcomeStart} />}
      {!showWelcome && (
        <div className="flex flex-col gap-2">
          {console.log("Rendering game controls and results")} {/* Log rendering */}
          <div id="game-controls" className="flex justify-end items-center gap-2 mt-2 min-h-[45px]">
            <button
              id="hint-btn"
              className="px-3 py-1 bg-aged-paper-dark text-typewriter-ink rounded border border-gray-300 shadow-typewriter hover:bg-aged-paper focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] min-h-[36px] flex items-center justify-center transition-all text-sm"
              aria-label="Get a hint for a blank"
            >
              Hint (3)
            </button>
            <button
              id="analysis-btn"
              className="px-3 py-1 bg-aged-paper-dark text-typewriter-ink rounded border border-gray-300 shadow-typewriter hover:bg-aged-paper focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] min-h-[36px] flex items-center justify-center transition-all text-sm"
              aria-label="Show analysis of the passage"
              style={{display: 'none'}}
            >
              Analysis
            </button>
            <button
              id="submit-btn"
              className="px-3 py-1 bg-aged-paper-dark text-typewriter-ink rounded border border-gray-300 shadow-typewriter hover:bg-aged-paper focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] min-h-[36px] flex items-center justify-center transition-all text-sm"
              aria-label="Submit your answers"
            >
              Submit
            </button>
            <button
              id="continue-btn"
              className="px-3 py-1 bg-aged-paper-dark text-typewriter-ink rounded border border-gray-300 shadow-typewriter hover:bg-aged-paper focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] min-h-[36px] flex items-center justify-center transition-all text-sm"
              aria-label="Continue to the next round"
              style={{display: 'none'}}
            >
              Continue
            </button>
          </div>
          <footer id="result" className="text-center text-lg font-medium text-shadow-typewriter"></footer>
          <span
            id="round-info"
            className="text-center text-lg tracking-typewriter font-typewriter px-3"
            aria-live="polite"
          >
            Loading...
          </span>
        </div>
      )}
    </>
  );
};

// Render the App component
render(<App />, document.getElementById('app') || document.body);

// Render the SettingsFooter component
const settingsFooterContainer = document.getElementById('settings-footer-container');
if (settingsFooterContainer) {
  render(<SettingsFooter isRemoteInterface={isRemoteInterface} />, settingsFooterContainer);
} else {
  console.error('Settings footer container not found!');
}
