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
 * Currently empty as the component manages its own state and interacts with localStorage/signals.
 */
interface ApiConfigurationProps {}

/**
 * ApiConfiguration component for managing the OpenRouter API key.
 * Allows users to input, save, and validate their API key.
 */
export const ApiConfiguration: FunctionComponent<ApiConfigurationProps> = () => {
  const [inputKey, setInputKey] = useState(apiKeySignal.value);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Effect to ensure the input field and signal reflect the latest from localStorage on mount
  // and to update the input field if the signal changes externally.
  useEffect(() => {
    const currentStoredKey = getEnvironmentConfig().OPENROUTER_API_KEY;
    setInputKey(currentStoredKey);
    // Ensure the signal is also in sync with the potentially updated localStorage value
    if (apiKeySignal.value !== currentStoredKey) {
      apiKeySignal.value = currentStoredKey;
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

  const messageClass = messageType === 'success' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="mb-4">
      <label htmlFor="api-key-input" className="block mb-2 text-typewriter-ink">OpenRouter API Key</label>
      <input
        id="api-key-input"
        type="password"
        className="w-full p-2 border border-typewriter-ink bg-aged-paper-light rounded focus:outline-none focus:border-typewriter-ribbon"
        placeholder="sk-or-..."
        value={inputKey}
        onInput={(e) => setInputKey((e.target as HTMLInputElement).value)}
      />
      <p className="text-sm mt-1 text-typewriter-ink opacity-70">
        {isUsingUserProvidedApiKey() 
          ? "Custom API key is being used" 
          : "Using default API key. Get your own at "}
        {!isUsingUserProvidedApiKey() && 
          <a href="https://openrouter.ai" target="_blank" className="underline hover:text-typewriter-ribbon">openrouter.ai</a>}
      </p>
      <button
        onClick={handleSave}
        className="mt-2 px-4 py-2 bg-typewriter-ink text-aged-paper rounded hover:bg-opacity-80 typewriter-key"
      >
        Save API Key
      </button>
      {message && <p className={`mt-2 text-sm ${messageClass}`}>{message}</p>}
    </div>
  );
};

// Export isValidApiKey for use in other modules if needed
export { isValidApiKey };
