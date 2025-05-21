import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { SettingsFooter } from './components/settings/SettingsFooter';
import { WelcomeOverlay } from './components/welcome/WelcomeOverlay';
import { apiKeySignal } from './components/settings/ApiConfiguration';
import { categorySignal, authorSignal, centurySignal } from './components/settings/QueryOptions';
import { startRound } from './services/gameLogic';

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
      <div class="flex flex-col items-center justify-center p-8 text-center" aria-live="polite">
        <p class="text-lg typewriter-text mb-3">Fetching new passage...</p>
        <p class="text-sm opacity-70 mb-4">*click* *clack* *ding*</p>
        <div role="status" aria-label="Loading passage" class="relative h-2 w-48 bg-aged-paper-dark overflow-hidden rounded-full">
          <div class="absolute top-0 left-0 h-full bg-typewriter-ribbon animate-pulse rounded-full" style="width: 30%"></div>
        </div>
      </div>
    `;
  }
  
  // Call startRound from gameLogic.ts
  try {
    if (typeof window !== 'undefined' && typeof (window as any).startRound === 'function') {
      (window as any).startRound(forceNewPassage);
    } else {
      startRound(forceNewPassage);
    }
    console.log("APP.TSX: startRound call completed successfully");
  } catch (error) {
    console.error("APP.TSX: Error in startRound:", error);
    
    // Show error state in the game area
    if (gameArea) {
      gameArea.innerHTML = `
        <div class="text-center p-6" aria-live="assertive">
          <p class="text-lg typewriter-text text-red-600 mb-2">Oops! We couldn't fetch a passage.</p>
          <p class="typewriter-text mb-4">Please try again later or check your connection.</p>
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
};

// Main application component
const App = () => {
  // Always show welcome overlay initially
  const [showWelcome, setShowWelcome] = useState(true);
  // isFirstLoad and the related useEffect are no longer needed as welcome is always shown first
  // const [isFirstLoad, setIsFirstLoad] = useState(true);

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
    startGameRound(true);
  };

  return (
    <>
      {showWelcome && <WelcomeOverlay onStart={handleWelcomeStart} />}
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
