// src/utils/errorHandling.ts

import { debugLog } from './debugLog';

/**
 * Custom error types for different categories of errors
 */
export class ApiError extends Error {
  status?: number;
  endpoint?: string;

  constructor(message: string, status?: number, endpoint?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
    
    // This is needed for proper instanceof checks with custom Error subclasses
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class CacheError extends Error {
  cacheKey?: string;

  constructor(message: string, cacheKey?: string) {
    super(message);
    this.name = 'CacheError';
    this.cacheKey = cacheKey;
    
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

export class DataError extends Error {
  data?: any;

  constructor(message: string, data?: any) {
    super(message);
    this.name = 'DataError';
    this.data = data;
    
    Object.setPrototypeOf(this, DataError.prototype);
  }
}

export class UIError extends Error {
  element?: string;

  constructor(message: string, element?: string) {
    super(message);
    this.name = 'UIError';
    this.element = element;
    
    Object.setPrototypeOf(this, UIError.prototype);
  }
}

/**
 * Standardized error logging function
 * @param error The error to log
 * @param context Additional context information
 * @param level Log level (error, warn, info)
 */
export function logError(
  error: Error | string,
  context: Record<string, any> = {},
  level: 'error' | 'warn' | 'info' = 'error'
): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const errorType = errorObj.constructor.name;
  const errorMessage = errorObj.message;
  const errorStack = errorObj.stack;

  // Create a structured error object
  const logData = {
    type: errorType,
    message: errorMessage,
    ...context,
    stack: errorStack
  };

  // Log to console with appropriate level
  if (level === 'error') {
    console.error(`[${errorType}]`, errorMessage, context);
  } else if (level === 'warn') {
    console.warn(`[${errorType}]`, errorMessage, context);
  } else {
    console.info(`[${errorType}]`, errorMessage, context);
  }

  // Also log to debugLog for consistency
  debugLog(`${level.toUpperCase()}: ${errorMessage}`, logData);
}

/**
 * Handle API errors with standardized approach
 * @param error The error that occurred
 * @param endpoint The API endpoint that was called
 * @param fallback Optional fallback value to return
 * @returns The fallback value if provided
 * @throws The standardized error if no fallback is provided
 */
export function handleApiError<T>(error: any, endpoint: string, fallback?: T): T | never {
  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : undefined;
  const message = error instanceof Error ? error.message : String(error);
  
  const apiError = new ApiError(
    `API Error: ${message}`,
    status,
    endpoint
  );
  
  logError(apiError, { originalError: error });
  
  if (fallback !== undefined) {
    return fallback;
  }
  
  throw apiError;
}

/**
 * Handle data processing errors with standardized approach
 * @param error The error that occurred
 * @param data The data that was being processed
 * @param fallback Optional fallback value to return
 * @returns The fallback value if provided
 * @throws The standardized error if no fallback is provided
 */
export function handleDataError<T>(error: any, data: any, fallback?: T): T | never {
  const message = error instanceof Error ? error.message : String(error);
  
  const dataError = new DataError(
    `Data Error: ${message}`,
    data
  );
  
  logError(dataError, { originalError: error });
  
  if (fallback !== undefined) {
    return fallback;
  }
  
  throw dataError;
}

/**
 * Handle UI errors with standardized approach
 * @param error The error that occurred
 * @param element The UI element that was involved
 */
export function handleUIError(error: any, element: string): void {
  const message = error instanceof Error ? error.message : String(error);
  
  const uiError = new UIError(
    `UI Error: ${message}`,
    element
  );
  
  logError(uiError, { originalError: error });
  
  // UI errors are always handled gracefully without re-throwing
  // They should be displayed to the user in a friendly way
}

/**
 * Create a standardized error message for display to users
 * @param error The error to format
 * @returns A user-friendly error message
 */
export function formatErrorForUser(error: any): string {
  if (error instanceof ApiError) {
    return `Unable to connect to the service. Please try again later.`;
  } else if (error instanceof DataError) {
    return `There was a problem processing the data. Please try again.`;
  } else if (error instanceof CacheError) {
    return `There was a problem retrieving cached data. Please refresh the page.`;
  } else if (error instanceof UIError) {
    return `There was a problem with the user interface. Please refresh the page.`;
  } else {
    return `An unexpected error occurred. Please try again later.`;
  }
}