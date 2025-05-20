import { h, FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface WelcomeOverlayProps {
  onStart: () => void;
}

export const WelcomeOverlay: FunctionComponent<WelcomeOverlayProps> = ({ onStart }) => {
  const [visible, setVisible] = useState(true);
  
  const handleStart = () => {
    console.log("WelcomeOverlay: Start button clicked");
    console.log("WelcomeOverlay: Setting visible to false");
    setVisible(false);
    console.log("WelcomeOverlay: Calling onStart callback");
    onStart();
    console.log("WelcomeOverlay: onStart callback completed");
  };
  
  // Effect for potential typewriter animations or other initial setup
  useEffect(() => {
    console.log("WelcomeOverlay: Component mounted");
    // Add any initial setup logic here if needed
    
    // Clean up function if necessary
    return () => {
      console.log("WelcomeOverlay: Component unmounted");
    };
  }, []); // Empty dependency array means this effect runs once on mount

  if (!visible) return null; // Don't render if not visible
  
  return (
    <div 
      id="welcome-overlay" 
      className="fixed inset-0 bg-typewriter-ribbon bg-opacity-85 flex items-center justify-center z-50"
      onClick={() => console.log("WelcomeOverlay: Container click detected")}
    >
      <div 
        className="bg-aged-paper p-8 rounded shadow-typewriter max-w-2xl w-full"
        onClick={() => console.log("WelcomeOverlay: Modal click detected")}
      >
        <h1 className="text-3xl font-bold mb-6 text-shadow-typewriter text-center">Cloze</h1>
        
        <div className="prose prose-lg mb-6 typewriter-text">
          <strong>How to Play</strong>:
          <ol className="list-decimal pl-5 space-y-2">
            <li>Load book excerpts sourced from Gutenberg Project</li>
            <li>Read context clues to infer missing words and fill in the blanks</li>
            <li>Get at least half correct to level up</li>
          </ol>

          <h2 className="text-xl font-bold mt-4 mb-2">Game Controls</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Category:</strong> Choose a topic or random.</li>
            <li><strong>Author:</strong> Optionally specify.</li>
            <li><strong>Hint:</strong> Get a hint (limited).</li>
            <li><strong>Submit:</strong> Check answers.</li>
          </ul>

          <p className="mt-4"><strong>Note:</strong> OpenRouter API key recommended (add in Settings).</p>
        </div>
        
        <div className="text-center">
          <button 
            id="start-game-btn" 
            className="px-6 py-3 bg-purple-600 text-typewriter-ink font-bold text-lg rounded shadow-typewriter hover:bg-purple-700 transform transition hover:scale-105 cursor-pointer" 
            style={{
              position: "relative", 
              zIndex: 9999, 
              border: "3px dashed #FF5500", 
              boxShadow: "0 0 10px rgba(255, 85, 0, 0.5)"
            }}
            data-action="start-game"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("WelcomeOverlay: Button onClick triggered");
              // The direct call to window.startRound() is removed from here.
              // The game start will be handled by the onStart prop callback.
              handleStart();
            }}
          >
            ► START READING ◄
          </button>
        </div>
      </div>
    </div>
  );
};
