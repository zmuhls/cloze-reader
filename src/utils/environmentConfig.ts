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
  // Add other environment variables here as needed
}

/**
 * Retrieves the current environment configuration
 * Prioritizes user-provided values in localStorage over defaults
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Try to get user-set API key from localStorage
  const userProvidedKey = localStorage.getItem('openrouter_api_key');
  const isUserKeyValid = Boolean(userProvidedKey) && 
                        userProvidedKey!.startsWith('sk-or-') && 
                        userProvidedKey!.length > 20;
  
  // Decode the default key only when needed
  const defaultKey = atob(ENCODED_DEFAULT_KEY);
  
  // Use user key if valid, otherwise use the default key
  const apiKey = isUserKeyValid ? userProvidedKey! : defaultKey;
  
  debugLog("Environment config loaded", { 
    usingUserKey: isUserKeyValid,
    keyFormat: apiKey.substring(0, 8) + "..."
  });
  
  return {
    OPENROUTER_API_KEY: apiKey,
  };
}

/**
 * Checks if a user-provided API key is being used
 * Useful for determining if we're using a default key or user-provided key
 */
export function isUsingUserProvidedApiKey(): boolean {
  const userProvidedKey = localStorage.getItem('openrouter_api_key');
  return Boolean(userProvidedKey) && 
         userProvidedKey!.startsWith('sk-or-') && 
         userProvidedKey!.length > 20;
}

/**
 * Sets a user-provided API key in localStorage
 * Also validates the key format
 * @param key The API key to set
 * @returns Whether the key was valid and set successfully
 */
export function setUserApiKey(key: string): boolean {
  const trimmedKey = key.trim();
  if (trimmedKey && trimmedKey.startsWith('sk-or-') && trimmedKey.length > 20) {
    localStorage.setItem('openrouter_api_key', trimmedKey);
    return true;
  }
  return false;
}
