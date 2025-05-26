import { h, FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { QueryOptions } from './QueryOptions';

interface SettingsFooterProps {
  isRemoteInterface?: boolean;
}

export const SettingsFooter: FunctionComponent<SettingsFooterProps> = ({ 
  isRemoteInterface = window.location.hostname.includes('github.io') 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Handle initial render to prevent content flash
  useEffect(() => {
    setIsRendered(true);
  }, []);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Add global function to toggle settings from header button
  useEffect(() => {
    (window as any).toggleSettings = toggleExpanded;
    return () => {
      delete (window as any).toggleSettings;
    };
  }, []);

  // Add event listener for header settings button
  useEffect(() => {
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      const handleClick = () => toggleExpanded();
      settingsBtn.addEventListener('click', handleClick);
      return () => {
        settingsBtn.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <div className={`settings-footer ${isExpanded ? 'expanded' : ''}`} role="region" aria-label="Game settings">
      <div 
        className="settings-header minimalist-header" 
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-controls="settings-content"
      >
        <span className="settings-icon">
          {isExpanded ? '▼' : '▲'} 
          <span className="px-1">Search & Settings</span>
        </span>
      </div>
      
      <div 
        id="settings-content"
        className="settings-content"
        style={{ 
          maxHeight: isExpanded ? '500px' : '0',
          opacity: isExpanded ? '1' : '0',
          visibility: isExpanded ? 'visible' : 'hidden' 
        }}
      >
        <div className="p-4 bg-aged-paper-light rounded shadow-sm">
          <QueryOptions isRemoteInterface={isRemoteInterface} />
        </div>
      </div>
    </div>
  );
};
