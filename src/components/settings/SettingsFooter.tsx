import { h, FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { ApiConfiguration } from './ApiConfiguration';
import { GameSettings } from './GameSettings';

export const SettingsFooter: FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`settings-footer ${isExpanded ? 'expanded' : ''}`}>
      <div className="settings-header minimalist-header" onClick={toggleExpanded}>
        <span className="settings-icon">{isExpanded ? '▼' : '▲'} Settings</span>
      </div>
      {isExpanded && (
        <div className="settings-content">
          <ApiConfiguration />
          <GameSettings />
        </div>
      )}
    </div>
  );
};
