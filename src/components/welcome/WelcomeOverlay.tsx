import { h, FunctionComponent } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface WelcomeOverlayProps {
  onStart: () => void;
}

export const WelcomeOverlay: FunctionComponent<WelcomeOverlayProps> = ({ onStart }) => {
  const [visible, setVisible] = useState(true);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
  // When component mounts, focus the start button for accessibility
  useEffect(() => {
    if (visible && startButtonRef.current) {
      startButtonRef.current.focus();
    }
    
    // Trap focus within the modal when it's visible
    const handleTabKey = (e: KeyboardEvent) => {
      if (!visible || e.key !== 'Tab') return;
      
      // List of all focusable elements in the overlay
      const modal = document.querySelector('#welcome-modal');
      if (!modal) return;
      
      const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey) {
        // If shift+tab and on first element, wrap to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // If tab and on last element, wrap to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    // Handle escape key to close the modal
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (visible && e.key === 'Escape') {
        handleStart();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [visible]);
  
  const handleStart = () => {
    setVisible(false);
    onStart();
  };
  
  // Don't render if not visible
  if (!visible) return null;
  
  return (
    <div 
      id="welcome-overlay" 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={(e) => {
        // Only close if the click was on the backdrop, not the modal itself
        if ((e.target as HTMLElement).id === 'welcome-overlay') {
          handleStart();
        }
      }}
    >
      <div 
        id="welcome-modal"
        className="bg-aged-paper p-6 md:p-8 rounded-lg shadow-lg max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 
          id="welcome-title" 
          className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-typewriter-ink text-center"
        >
          Cloze Reader
        </h1>
        
        <div className="prose prose-lg mb-6 typewriter-text text-typewriter-ink">
          <div className="mb-4">
            <strong className="text-lg">How to Play</strong>
            <ol className="list-inside space-y-1 mt-2">
              <li>Load book excerpts from the Gutenberg Project</li>
              <li>Read context clues to infer missing words</li>
              <li>Get at least half correct to level up</li>
            </ol>
          </div>

          <div>
            <strong className="text-lg">Game Controls</strong>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
              <li className="flex items-center">
                <span className="text-typewriter-ribbon mr-2"></span>
                <span><strong>Topic:</strong> Choose a category</span>
              </li>
              <li className="flex items-center">
                <span className="text-typewriter-ribbon mr-2"></span>
                <span><strong>Author:</strong> Specify if desired</span>
              </li>
              <li className="flex items-center">
                <span className="text-typewriter-ribbon mr-2"></span>
                <span><strong>Century:</strong> Filter by time period</span>
              </li>
              <li className="flex items-center">
                <span className="text-typewriter-ribbon mr-2"></span>
                <span><strong>Hint:</strong> Get help (limited)</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="text-center">
          <button 
            ref={startButtonRef}
            id="start-game-btn" 
            className="px-6 py-3 bg-typewriter-ribbon text-aged-paper font-bold text-lg rounded shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-typewriter-ink focus:ring-offset-2 focus:ring-offset-aged-paper transition-all duration-200"
            aria-label="Start game"
            onClick={(e) => {
              e.preventDefault();
              handleStart();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleStart();
              }
            }}
          >
            ► START READING ◄
          </button>
        </div>
      </div>
    </div>
  );
};
