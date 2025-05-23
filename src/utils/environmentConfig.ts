// src/utils/environmentConfig.ts

import { debugLog } from './debugLog';

/**
 * Environment configuration management for the application
 * Handles secure storage and retrieval of sensitive configuration values
 */

// Define the default safe fallback key (will be used if no key is found)
// This key is obfuscated to prevent direct copying
const ENCODED_DEFAULT_KEY = 'c2stb3ItdjEtNGY4MmQ3NDBlZmQyNjlhY2IwYTA4MGIzMTgyNTQ5NDlhMTQ5Y2FlYTZmNzFkODAxMGM0MDJkNWQ5ZGViYjQ1Zg==';

/**
 * Interface defining the environment configuration structure
 */
export interface EnvironmentConfig {
  OPENROUTER_API_KEY: string;
  IS_REMOTE_INTERFACE: boolean;
  // Add other environment variables here as needed
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
  
  // Try to get user-set API key from localStorage
  const userProvidedKey = localStorage.getItem('openrouter_api_key') || '';
  const isUserKeyValid = Boolean(userProvidedKey) && 
                          userProvidedKey!.startsWith('sk-or-') && 
                          userProvidedKey!.length > 20;
  
  // Decode the default key
  const defaultKey = atob(ENCODED_DEFAULT_KEY);
  
  // Use default key if in remote interface, otherwise use user key if valid
  const apiKey = remote ? defaultKey : (isUserKeyValid ? userProvidedKey! : defaultKey);
  
  debugLog("Environment config loaded", { 
    isRemoteInterface: remote,
    usingUserKey: !remote && isUserKeyValid,
    keyFormat: apiKey.substring(0, 8) + "..."
  });
  
  return {
    OPENROUTER_API_KEY: apiKey,
    IS_REMOTE_INTERFACE: remote
  };
}

/**
 * Checks if a user-provided API key is being used
 * Useful for determining if we're using a default key or user-provided key
 * Always returns false in remote interfaces for security
 */
export function isUsingUserProvidedApiKey(): boolean {
  // In remote interfaces, always report as using the default key
  if (isRemoteInterface()) {
    return false;
  }
  
  const userProvidedKey = localStorage.getItem('openrouter_api_key');
  return Boolean(userProvidedKey) && 
         userProvidedKey!.startsWith('sk-or-') && 
         userProvidedKey!.length > 20;
}

/**
 * Sets a user-provided API key in localStorage
 * Also validates the key format
 * In remote interfaces, this is a no-op for security
 * @param key The API key to set
 * @returns Whether the key was valid and set successfully
 */
export function setUserApiKey(key: string): boolean {
  // In remote interfaces, don't allow setting custom API keys
  if (isRemoteInterface()) {
    debugLog("Cannot set custom API key in remote interface");
    return false;
  }
  
  const trimmedKey = key.trim();
  if (trimmedKey && trimmedKey.startsWith('sk-or-') && trimmedKey.length > 20) {
    debugLog("Valid API key provided:", trimmedKey);
    localStorage.setItem('openrouter_api_key', trimmedKey);
    return true;
  }
  return false;
}
