// src/utils/cacheValidation.ts

import { debugLog } from './debugLog';
import { CacheError } from './errorHandling';

/**
 * Interface for passage data structure
 */
export interface PassageData {
  paragraphs: string[];
  metadata: {
    title: string;
    author: string;
    id: number;
    century?: string;
    canonicalUrl?: string;
    factoid?: string;
  } | null;
  timestamp?: number;
}

/**
 * Cache validation options
 */
export interface CacheValidationOptions {
  /**
   * Whether to force a fresh fetch ignoring cache
   */
  forceNewFetch?: boolean;
  
  /**
   * Cache expiration time in milliseconds
   */
  expirationTime?: number;
}

/**
 * Default cache validation options
 */
const DEFAULT_VALIDATION_OPTIONS: CacheValidationOptions = {
  forceNewFetch: false,
  expirationTime: 60 * 60 * 1000 // 1 hour
};

/**
 * Validates a cached passage and returns whether it's valid
 * @param passageData The passage data to validate
 * @param cacheKey The cache key for the passage
 * @param options Validation options
 * @returns Boolean indicating whether the cache is valid
 */
export function validateCachedPassage(
  passageData: PassageData,
  cacheKey: string,
  options: CacheValidationOptions = {}
): boolean {
  // Merge options with defaults
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  
  // If forcing a new fetch, cache is invalid
  if (opts.forceNewFetch) {
    debugLog("Cache validation: Forced new fetch", { cacheKey });
    return false;
  }
  
  // Check if cache is stale based on timestamp
  if (passageData.timestamp) {
    const now = Date.now();
    const isStale = now - passageData.timestamp > opts.expirationTime!;
    
    if (isStale) {
      debugLog("Cache validation: Cache is stale", {
        cacheKey,
        age: (now - passageData.timestamp) / 1000 / 60 + " minutes"
      });
      return false;
    }
  }
  
  // Validate basic structure
  if (!passageData.paragraphs || !Array.isArray(passageData.paragraphs) || passageData.paragraphs.length === 0) {
    debugLog("Cache validation: Invalid paragraphs structure", { cacheKey });
    return false;
  }
  
  // Check if paragraphs have content
  const hasContent = passageData.paragraphs.some(p => p && p.trim().length > 0);
  if (!hasContent) {
    debugLog("Cache validation: No content in paragraphs", { cacheKey });
    return false;
  }
  
  // If we got here, cache is valid
  return true;
}

/**
 * Validates a cached passage string and returns the parsed data if valid
 * @param cachedPassageString The cached passage string to validate
 * @param cacheKey The cache key for the passage
 * @param options Validation options
 * @returns The parsed passage data if valid, null otherwise
 */
export function validateAndParseCachedPassage(
  cachedPassageString: string | null,
  cacheKey: string,
  options: CacheValidationOptions = {}
): PassageData | null {
  if (!cachedPassageString) {
    return null;
  }
  
  try {
    const parsedCache = JSON.parse(cachedPassageString);
    
    if (!parsedCache || !parsedCache.paragraphs || !Array.isArray(parsedCache.paragraphs)) {
      throw new CacheError("Invalid cache format", cacheKey);
    }
    
    const passageData: PassageData = {
      paragraphs: parsedCache.paragraphs,
      metadata: parsedCache.metadata || null,
      timestamp: parsedCache.timestamp
    };
    
    const isValid = validateCachedPassage(passageData, cacheKey, options);
    
    return isValid ? passageData : null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CacheError(`Invalid JSON in cache: ${error.message}`, cacheKey);
    }
    throw error;
  }
}