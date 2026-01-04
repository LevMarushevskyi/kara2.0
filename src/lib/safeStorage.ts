/**
 * Safe localStorage wrapper with graceful error handling
 *
 * Handles cases where localStorage is:
 * - Disabled (private browsing mode)
 * - Full (quota exceeded)
 * - Unavailable (sandboxed iframes, etc.)
 */

/**
 * Checks if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely gets an item from localStorage
 * Returns null if localStorage is unavailable or the key doesn't exist
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read from localStorage (key: ${key}):`, e);
    return null;
  }
}

/**
 * Safely sets an item in localStorage
 * Returns true if successful, false otherwise
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // Check if it's a quota exceeded error
    if (e instanceof DOMException && (
      e.code === 22 || // Legacy Chrome/Firefox
      e.code === 1014 || // Firefox
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn(`localStorage quota exceeded (key: ${key}). Consider clearing old data.`);
    } else {
      console.warn(`Failed to write to localStorage (key: ${key}):`, e);
    }
    return false;
  }
}

/**
 * Safely removes an item from localStorage
 * Returns true if successful, false otherwise
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Failed to remove from localStorage (key: ${key}):`, e);
    return false;
  }
}

/**
 * Safely parses JSON from localStorage
 * Returns the default value if parsing fails or the key doesn't exist
 */
export function safeGetJSON<T>(key: string, defaultValue: T): T {
  const item = safeGetItem(key);
  if (item === null) {
    return defaultValue;
  }

  try {
    return JSON.parse(item) as T;
  } catch (e) {
    console.warn(`Failed to parse JSON from localStorage (key: ${key}):`, e);
    return defaultValue;
  }
}

/**
 * Safely stores JSON in localStorage
 * Returns true if successful, false otherwise
 */
export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    const jsonString = JSON.stringify(value);
    return safeSetItem(key, jsonString);
  } catch (e) {
    console.warn(`Failed to stringify JSON for localStorage (key: ${key}):`, e);
    return false;
  }
}

/**
 * Clears old entries from localStorage to free up space
 * This is useful when quota is exceeded
 */
export function clearOldEntries(keysToPreserve: string[] = []): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToPreserve.includes(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Failed to clear old localStorage entries:', e);
  }
}
