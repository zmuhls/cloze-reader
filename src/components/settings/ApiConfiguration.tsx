import { h, FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import * as signals from '@preact/signals'; // Changed to namespace import
import { setUserApiKey, isUsingUserProvidedApiKey, getEnvironmentConfig } from '@/utils/environmentConfig';

/**
 * Signals for storing and accessing API keys globally.
 * Initialize from environment configuration
 */
export const openRouterKeySignal = signals.signal(getEnvironmentConfig().OPENROUTER_API_KEY);
export const huggingFaceKeySignal = signals.signal(getEnvironmentConfig().HUGGINGFACE_API_KEY);

/**
 * Helper function to check if an API key is valid.
 * @param key The API key string to validate.
 * @param type The type of API key to validate ('openrouter' or 'huggingface')
 * @returns True if the key is valid, false otherwise.
 */
function isValidApiKey(key: string, type: 'openrouter' | 'huggingface'): boolean {
  if (!key) return false;
  
  switch (type) {
    case 'openrouter':
      return key.startsWith('sk-or-') && key.length > 20;
    case 'huggingface':
      return key.startsWith('hf_') && key.length > 20;
    default:
      return false;
  }
}

/**
 * Props for the ApiConfiguration component.
 */
interface ApiConfigurationProps {
  isRemoteInterface?: boolean;
}

/**
 * ApiConfiguration component for managing the OpenRouter API key.
 * Allows users to input, save, and validate their API key.
 * In remote interfaces, it automatically uses the default key without showing the input.
 */
export const ApiConfiguration: FunctionComponent<ApiConfigurationProps> = ({ 
  isRemoteInterface = window.location.hostname.includes('github.io')
}) => {
  const [openRouterKey, setOpenRouterKey] = useState(openRouterKeySignal.value);
  const [huggingFaceKey, setHuggingFaceKey] = useState(huggingFaceKeySignal.value);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | ''>('');

  // Effect to ensure the input fields and signals reflect the latest from localStorage
  useEffect(() => {
    const config = getEnvironmentConfig();
    setOpenRouterKey(config.OPENROUTER_API_KEY);
    setHuggingFaceKey(config.HUGGINGFACE_API_KEY);
    
    // Ensure signals are in sync
    if (openRouterKeySignal.value !== config.OPENROUTER_API_KEY) {
      openRouterKeySignal.value = config.OPENROUTER_API_KEY;
    }
    if (huggingFaceKeySignal.value !== config.HUGGINGFACE_API_KEY) {
      huggingFaceKeySignal.value = config.HUGGINGFACE_API_KEY;
    }

    // For remote interfaces, ensure we're using default keys
    if (isRemoteInterface) {
      console.log("Remote interface detected, using default API keys");
      localStorage.removeItem('openrouter_api_key');
      localStorage.removeItem('huggingface_api_key');
      openRouterKeySignal.value = config.OPENROUTER_API_KEY;
      huggingFaceKeySignal.value = config.HUGGINGFACE_API_KEY;
    }
  }, []); // Runs once on mount

  /**
   * Handles saving the API keys using the environment utility and updating the signals.
   * @param type The type of API key being saved
   * @param key The API key value to save
   */
  const handleSave = (type: 'openrouter' | 'huggingface', key: string) => {
    const isValid = setUserApiKey(key, type);
    
    if (isValid) {
      const config = getEnvironmentConfig();
      if (type === 'openrouter') {
        openRouterKeySignal.value = config.OPENROUTER_API_KEY;
      } else {
        huggingFaceKeySignal.value = config.HUGGINGFACE_API_KEY;
      }
      
      setMessageType('success');
      setMessage(`${type === 'openrouter' ? 'OpenRouter' : 'Hugging Face'} API key saved successfully!`);
    } else {
      setMessageType('error');
      setMessage(`Please enter a valid ${type === 'openrouter' ? 'OpenRouter (sk-or-)' : 'Hugging Face (hf_)'} API key`);
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const messageClass = 
    messageType === 'success' ? 'text-green-600' : 
    messageType === 'error' ? 'text-red-600' : 
    messageType === 'info' ? 'text-blue-600' : '';

  // When running in a remote interface, don't show the API key input UI
  if (isRemoteInterface) {
    return null;
  }

  return (
    <div className="mb-4 mt-6 pt-4 border-t border-typewriter-ink border-opacity-20">
      <h3 className="text-lg font-semibold mb-2 text-typewriter-ink">API Configuration</h3>
      
      {/* Security Warning */}
      <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded text-yellow-900 flex items-start gap-2">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
        <span>
          <strong>Security Notice:</strong> API keys entered here are stored in your browser and may be visible in browser developer tools or network logs. <br />
          <span className="font-semibold">Do not reuse API keys from other projects or accounts.</span> Use a dedicated key for this app only.
        </span>
      </div>

      {/* OpenRouter API Key Input */}
      <div className="mb-4">
        <label htmlFor="openrouter-key-input" className="block mb-2 text-typewriter-ink">OpenRouter API Key</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="openrouter-key-input"
            type="password"
            className="flex-grow p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon"
            placeholder="sk-or-..."
            value={openRouterKey}
            onInput={(e) => setOpenRouterKey((e.target as HTMLInputElement).value)}
            aria-label="OpenRouter API Key input"
          />
          <button
            onClick={() => handleSave('openrouter', openRouterKey)}
            className="px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 focus:ring-2 focus:ring-typewriter-ribbon focus:outline-none typewriter-key min-w-[120px] min-h-[42px] flex items-center justify-center"
            aria-label="Save OpenRouter API key"
          >
            Save Key
          </button>
        </div>
        <p className="text-sm mt-1 text-typewriter-ink opacity-80">Get your key at openrouter.ai</p>
      </div>

      {/* Hugging Face API Key Input */}
      <div className="mb-4">
        <label htmlFor="huggingface-key-input" className="block mb-2 text-typewriter-ink">Hugging Face API Key</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="huggingface-key-input"
            type="password"
            className="flex-grow p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon"
            placeholder="hf_..."
            value={huggingFaceKey}
            onInput={(e) => setHuggingFaceKey((e.target as HTMLInputElement).value)}
            aria-label="Hugging Face API Key input"
          />
          <button
            onClick={() => handleSave('huggingface', huggingFaceKey)}
            className="px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 focus:ring-2 focus:ring-typewriter-ribbon focus:outline-none typewriter-key min-w-[120px] min-h-[42px] flex items-center justify-center"
            aria-label="Save Hugging Face API key"
          >
            Save Key
          </button>
        </div>
        <p className="text-sm mt-1 text-typewriter-ink opacity-80">Get your key at huggingface.co</p>
      </div>

      {message && <p className={`mt-2 text-sm ${messageClass}`} role="status">{message}</p>}
    </div>
  );
};

export { isValidApiKey };

// Backward compatibility: export apiKeySignal as openRouterKeySignal
export const apiKeySignal = openRouterKeySignal;
