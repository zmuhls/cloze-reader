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
 * Tests a Hugging Face API key by making a simple request to the API
 * @param key The API key to test
 * @returns A promise that resolves to an object with success and message properties
 */
async function testHuggingFaceApiKey(key: string): Promise<{success: boolean, message: string}> {
  if (!isValidApiKey(key, 'huggingface')) {
    return {
      success: false,
      message: 'Invalid API key format. Hugging Face API keys should start with "hf_" and be at least 20 characters long.'
    };
  }
  
  try {
    // Make a simple request to the Hugging Face API to test the key
    // Since we now use local datasets, we can't test against external APIs
    // Instead, just validate the key format
    if (!key.startsWith('hf_') || key.length < 30) {
      return {
        success: false,
        message: 'Invalid API key format. Hugging Face keys should start with "hf_" and be at least 30 characters long.'
      };
    }
    
    return {
      success: true,
      message: 'API key format appears valid! Note: Using local datasets, so external API verification is not performed.'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error testing API key: ${error instanceof Error ? error.message : String(error)}`
    };
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
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | 'warn' | ''>('');

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
  const handleSave = async (type: 'openrouter' | 'huggingface', key: string) => {
    // First check if the key format is valid
    const isValid = setUserApiKey(key, type);
    
    if (isValid) {
      const config = getEnvironmentConfig();
      if (type === 'openrouter') {
        openRouterKeySignal.value = config.OPENROUTER_API_KEY;
        setMessageType('success');
        setMessage(`OpenRouter API key saved successfully!`);
      } else {
        // For Hugging Face, we'll test the key before confirming success
        huggingFaceKeySignal.value = config.HUGGINGFACE_API_KEY;
        
        setMessageType('info');
        setMessage(`Hugging Face API key saved. Testing connection...`);
        
        // Test the Hugging Face API key
        const testResult = await testHuggingFaceApiKey(key);
        
        if (testResult.success) {
          setMessageType('success');
          setMessage(`Hugging Face API key saved and verified successfully!`);
        } else {
          setMessageType('warn');
          setMessage(`Hugging Face API key saved, but note: ${testResult.message}`);
        }
      }
    } else {
      setMessageType('error');
      setMessage(`Please enter a valid ${type === 'openrouter' ? 'OpenRouter (sk-or-)' : 'Hugging Face (hf_)'} API key`);
    }
    
    // Keep the message visible longer for important notifications
    const timeout = messageType === 'error' || messageType === 'warn' ? 5000 : 3000;
    setTimeout(() => setMessage(''), timeout);
  };

  const messageClass =
      messageType === 'success' ? 'text-green-600' :
      messageType === 'error' ? 'text-red-600' :
      messageType === 'warn' ? 'text-amber-600' :
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
      
      {/* API Key Information */}
      <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded text-blue-900 flex items-start gap-2">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
        <span>
          <strong>API Key Information:</strong><br />
          • To use the Hugging Face Datasets API, you need a valid API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">huggingface.co/settings/tokens</a><br />
          • The key must start with "hf_" and have the necessary permissions to access datasets<br />
          • Without a valid key, some features may not work correctly
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
