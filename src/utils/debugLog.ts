// src/utils/debugLog.ts

/**
 * Helper function to add detailed debug logs to the console.
 * Includes a timestamp and optional data payload.
 * @param message The main log message.
 * @param data Optional data to be logged as a JSON string.
 */
export function debugLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG ${timestamp}] ${message}`);
  if (data !== undefined) {
    try {
      // Attempt to stringify, handling potential circular references or large objects
      const jsonData = JSON.stringify(data, (key, value) => {
        if (value instanceof HTMLElement) {
          return `HTMLElement (${value.tagName}${value.id ? '#' + value.id : ''})`;
        }
        // Add more complex object handling here if needed
        return value;
      }, 2);
      console.log(jsonData);
    } catch (error) {
      console.log('[DEBUG Data Stringify Error]', error);
      console.log('[DEBUG Raw Data]', data); // Log raw data if stringify fails
    }
  }
}
