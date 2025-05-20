import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks'; // Import useState
import { SettingsFooter } from './components/settings/SettingsFooter';
import { WelcomeOverlay } from './components/welcome/WelcomeOverlay'; // Import WelcomeOverlay
import { apiKeySignal } from './components/settings/ApiConfiguration';
import { categorySignal, authorSignal } from './components/settings/GameSettings';
import { startRound } from './services/gameLogic'; // Import startRound directly

console.log("APP.TSX: Script loading");

// Function to start the game round (will be passed to WelcomeOverlay)
const startGameRound = () => {
  console.log("APP.TSX: startGameRound called");
  
  // Call startRound from gameLogic.ts
  console.log("APP.TSX: Calling startRound from gameLogic.ts");
  try {
    // Try to use the window.startRound function if available (added by main.ts)
    if (typeof window !== 'undefined' && typeof (window as any).startRound === 'function') {
      console.log("APP.TSX: Using window.startRound function");
      (window as any).startRound();
    } else {
      // Otherwise use the imported startRound function
      console.log("APP.TSX: Using imported startRound function");
      startRound();
    }
    console.log("APP.TSX: startRound call completed successfully");
  } catch (error) {
    console.error("APP.TSX: Error in startRound:", error);
  }
  
  // Also manually hide the welcome overlay as a fallback
  try {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    if (welcomeOverlay) {
      console.log("APP.TSX: Manually hiding welcome overlay");
      welcomeOverlay.classList.add('hidden');
    }
  } catch (e) {
    console.error("APP.TSX: Error hiding welcome overlay:", e);
  }
};

// Main application component
const App = () => {
  const [showWelcome, setShowWelcome] = useState(true); // State to control welcome overlay visibility

  // Listen to settings changes and trigger game updates
  useEffect(() => {
    const handleSettingsChange = () => {
      // Log settings changes
      console.log("Settings changed:", {
        apiKey: apiKeySignal.value ? "Key set" : "No key",
        category: categorySignal.value,
        author: authorSignal.value
      });
    };
    
    // Set up listeners for signals
    const unsubscribeApiKey = apiKeySignal.subscribe(handleSettingsChange);
    const unsubscribeCategory = categorySignal.subscribe(handleSettingsChange);
    const unsubscribeAuthor = authorSignal.subscribe(handleSettingsChange);
    
    return () => {
      unsubscribeApiKey();
      unsubscribeCategory();
      unsubscribeAuthor();
    };
  }, []);
  
  const handleWelcomeStart = () => {
    setShowWelcome(false); // Hide the welcome overlay
    startGameRound(); // Start the game round
  };

  return (
    <>
      {showWelcome && <WelcomeOverlay onStart={handleWelcomeStart} />} {/* Render WelcomeOverlay if showWelcome is true */}
      {/* Other main content components will go here */}
      {/* The SettingsFooter will be rendered into its dedicated container */}
    </>
  );
};

// Render the App component
render(<App />, document.getElementById('app') || document.body);

// Render the SettingsFooter component into the designated footer container
const settingsFooterContainer = document.getElementById('settings-footer-container');
if (settingsFooterContainer) {
  render(<SettingsFooter />, settingsFooterContainer);
} else {
  console.error('Settings footer container not found!');
}
