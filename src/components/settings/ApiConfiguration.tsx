import { h, FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { setUserApiKey, isUsingUserProvidedApiKey, getEnvironmentConfig } from '@/utils/environmentConfig';

/**
 * Signal for storing and accessing the OpenRouter API key globally.
 * Initializes from environment configuration
 */
export const apiKeySignal = signal(getEnvironmentConfig().OPENROUTER_API_KEY);

/**
 * Helper function to check if the API key is valid.
 * @param key The API key string to validate.
 * @returns True if the key is valid, false otherwise.
 */
function isValidApiKey(key: string): boolean {
  return Boolean(key) && key.startsWith('sk-or-') && key.length > 20;
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
  const [inputKey, setInputKey] = useState(apiKeySignal.value);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | ''>('');
  const [apiStatus, setApiStatus] = useState<'ready' | 'checking' | 'error'>('ready');

  // Effect to ensure the input field and signal reflect the latest from localStorage on mount
  // and to update the input field if the signal changes externally.
  useEffect(() => {
    const currentStoredKey = getEnvironmentConfig().OPENROUTER_API_KEY;
    setInputKey(currentStoredKey);
    
    // Ensure the signal is also in sync with the potentially updated localStorage value
    if (apiKeySignal.value !== currentStoredKey) {
      apiKeySignal.value = currentStoredKey;
    }

    // For remote interfaces, ensure we're using the default key
    if (isRemoteInterface && isUsingUserProvidedApiKey()) {
      console.log("Remote interface detected, using default API key");
      localStorage.removeItem('openrouter_api_key');
      apiKeySignal.value = getEnvironmentConfig().OPENROUTER_API_KEY;
    }
  }, []); // Runs once on mount to initialize from localStorage

  // This effect handles updates if apiKeySignal changes due to other interactions (e.g. after saving)
  useEffect(() => {
    setInputKey(apiKeySignal.value);
  }, [apiKeySignal.value]);

  /**
   * Handles saving the input API key using the environment utility and updating the signal.
   * Performs validation through the utility function.
   */
  const handleSave = () => {
    const isValid = setUserApiKey(inputKey);
    
    if (isValid) {
      // Update the signal with the new key from the environment
      apiKeySignal.value = getEnvironmentConfig().OPENROUTER_API_KEY;
      setMessageType('success');
      setMessage('API key saved successfully!');
    } else {
      setMessageType('error');
      setMessage('Please enter a valid OpenRouter API key (starts with sk-or-)');
    }
    
    // Clear message after a few seconds
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
      <label htmlFor="api-key-input" className="block mb-2 text-typewriter-ink">OpenRouter API Key</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="api-key-input"
          type="password"
          className="flex-grow p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:ring-2 focus:ring-typewriter-ribbon"
          placeholder="sk-or-..."
          value={inputKey}
          onInput={(e) => setInputKey((e.target as HTMLInputElement).value)}
          aria-label="OpenRouter API Key input"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 focus:ring-2 focus:ring-typewriter-ribbon focus:outline-none typewriter-key min-w-[120px] min-h-[42px] flex items-center justify-center"
          aria-label="Save API key"
        >
          Save API Key
        </button>
      </div>
      <p className="text-sm mt-2 text-typewriter-ink opacity-80">
        {isUsingUserProvidedApiKey() 
          ? "Custom API key is being used" 
          : "Using default API key. Get your own at openrouter.ai"}
      </p>
      {message && <p className={`mt-2 text-sm ${messageClass}`} role="status">{message}</p>}
    </div>
  );
};

// Export isValidApiKey for use in other modules if needed
export { isValidApiKey };
