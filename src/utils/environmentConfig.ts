// src/utils/environmentConfig.ts

/**
 * Environment configuration management for the application
 * Handles secure storage and retrieval of sensitive configuration values
 */

// Internal logging function to avoid circular dependencies
function logConfig(message: string, data?: any): void {
  console.log(`[Environment Config] ${message}`, data ? data : '');
}


// Define the default safe fallback keys (will be used if no key is found)
// These keys are obfuscated to prevent direct copying
const ENCODED_DEFAULT_OPENROUTER_KEY = 'c2stb3ItdjEtNGY4MmQ3NDBlZmQyNjlhY2IwYTA4MGIzMTgyNTQ5NDlhMTQ5Y2FlYTZmNzFkODAxMGM0MDJkNWQ5ZGViYjQ1Zg==';
const ENCODED_DEFAULT_HUGGINGFACE_KEY = 'aGZfZk1OZ0dIWXZkRnlQcFhXbGtYWHhLaHJCb3JPUmlGRWdMYg==';

/**
 * Interface defining the environment configuration structure
 */
export interface EnvironmentConfig {
  OPENROUTER_API_KEY: string;
  HUGGINGFACE_API_KEY: string;
  IS_REMOTE_INTERFACE: boolean;
}

/**
 * Determines if the application is running in a remote interface like GitHub Pages
 * @returns boolean indicating if this is a remote interface
 */
export function isRemoteInterface(): boolean {
  return window.location.hostname.includes('github.io') || 
         window.location.hostname === 'cloze-reader.vercel.app' ||
         window.location.protocol === 'file:';
}

/**
 * Retrieves the current environment configuration
 * Prioritizes user-provided values in localStorage over defaults
 * In remote interfaces, always uses the default key for security
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const remote = isRemoteInterface();
  
  // Try to get user-set API keys from localStorage
  const userProvidedOpenRouterKey = localStorage.getItem('openrouter_api_key') || '';
  const userProvidedHuggingFaceKey = localStorage.getItem('huggingface_api_key') || '';
  
  const isOpenRouterKeyValid = Boolean(userProvidedOpenRouterKey) && 
                              userProvidedOpenRouterKey!.startsWith('sk-or-') && 
                              userProvidedOpenRouterKey!.length > 20;
  
  const isHuggingFaceKeyValid = Boolean(userProvidedHuggingFaceKey) && 
                               userProvidedHuggingFaceKey!.startsWith('hf_') && 
                               userProvidedHuggingFaceKey!.length > 20;
  
  // Decode the default keys
  const defaultOpenRouterKey = atob(ENCODED_DEFAULT_OPENROUTER_KEY);
  const defaultHuggingFaceKey = atob(ENCODED_DEFAULT_HUGGINGFACE_KEY);
  
  // Use default keys if in remote interface, otherwise use user keys if valid
  const openRouterKey = remote ? defaultOpenRouterKey : (isOpenRouterKeyValid ? userProvidedOpenRouterKey! : defaultOpenRouterKey);
  const huggingFaceKey = remote ? defaultHuggingFaceKey : (isHuggingFaceKeyValid ? userProvidedHuggingFaceKey! : defaultHuggingFaceKey);
  
  logConfig("Environment config loaded", { 
    isRemoteInterface: remote,
    usingUserOpenRouterKey: !remote && isOpenRouterKeyValid,
    usingUserHuggingFaceKey: !remote && isHuggingFaceKeyValid,
    openRouterKeyFormat: openRouterKey.substring(0, 8) + "...",
    huggingFaceKeyFormat: huggingFaceKey.substring(0, 8) + "..."
  });
  
  return {
    OPENROUTER_API_KEY: openRouterKey,
    HUGGINGFACE_API_KEY: huggingFaceKey,
    IS_REMOTE_INTERFACE: remote
  };
}

/**
 * Checks if a user-provided API key is being used
 * Useful for determining if we're using a default key or user-provided key
 * Always returns false in remote interfaces for security
 * @param type The type of API key to check ('openrouter' or 'huggingface')
 */
export function isUsingUserProvidedApiKey(type: 'openrouter' | 'huggingface'): boolean {
  // In remote interfaces, always report as using the default key
  if (isRemoteInterface()) {
    return false;
  }
  
  const userProvidedKey = localStorage.getItem(`${type}_api_key`);
  if (!userProvidedKey) return false;

  switch (type) {
    case 'openrouter':
      return userProvidedKey.startsWith('sk-or-') && userProvidedKey.length > 20;
    case 'huggingface':
      return userProvidedKey.startsWith('hf_') && userProvidedKey.length > 20;
    default:
      return false;
  }
}

/**
 * Sets a user-provided API key in localStorage
 * Also validates the key format
 * In remote interfaces, this is a no-op for security
 * @param key The API key to set
 * @param type The type of API key ('openrouter' or 'huggingface')
 * @returns Whether the key was valid and set successfully
 */
export function setUserApiKey(key: string, type: 'openrouter' | 'huggingface'): boolean {
  // In remote interfaces, don't allow setting custom API keys
  if (isRemoteInterface()) {
    logConfig(`Cannot set custom ${type} API key in remote interface`);
    return false;
  }
  
  const trimmedKey = key.trim();
  let isValid = false;

  switch (type) {
    case 'openrouter':
      isValid = trimmedKey !== '' && trimmedKey.startsWith('sk-or-') && trimmedKey.length > 20;
      break;
    case 'huggingface':
      isValid = trimmedKey !== '' && trimmedKey.startsWith('hf_') && trimmedKey.length > 20;
      break;
  }

  if (isValid) {
    // Do not log the full API key for security; log only the format
    logConfig(`Valid ${type} API key provided:`, trimmedKey.substring(0, 8) + "...");
    localStorage.setItem(`${type}_api_key`, trimmedKey);
    return true;
  }
  return false;
}
