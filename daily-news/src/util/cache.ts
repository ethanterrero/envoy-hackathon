// Shared caching utility for localStorage with daily refresh at 8am
// Used by both market data and news articles to avoid code duplication

interface CacheData<T> {
  data: T;
  timestamp: number;
  lastFetchDate: string; // YYYY-MM-DD format
}

interface CacheOptions {
  key: string;
  refreshHour?: number; // Hour of day to refresh (default: 8am)
}

/**
 * Helper function to check if we should fetch new data
 * Only fetches if it's a new day AND past the refresh hour
 */
function shouldFetchData(cacheData: CacheData<unknown> | null, refreshHour: number = 8): boolean {
  if (!cacheData) return true; // No cache, fetch
  
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // If we haven't fetched today and it's past refresh hour, fetch
  if (cacheData.lastFetchDate !== today && currentHour >= refreshHour) {
    return true;
  }
  
  // Otherwise, use cache
  return false;
}

/**
 * Get cached data from localStorage
 * Returns null if cache doesn't exist or is expired
 */
export function getCachedData<T>(options: CacheOptions): T | null {
  try {
    const cached = localStorage.getItem(options.key);
    if (!cached) return null;

    const cacheData: CacheData<T> = JSON.parse(cached);
    
    // Check if we should fetch new data (once daily at refresh hour)
    if (shouldFetchData(cacheData, options.refreshHour)) {
      localStorage.removeItem(options.key);
      return null;
    }

    console.log(`✓ Using cached data for "${options.key}" (valid until tomorrow ${options.refreshHour || 8}am)`);
    return cacheData.data;
  } catch (error) {
    console.error(`Error reading cache for "${options.key}":`, error);
    return null;
  }
}

/**
 * Set cached data in localStorage
 * Data will be cached until the next day at the refresh hour
 */
export function setCachedData<T>(data: T, options: CacheOptions): void {
  try {
    const now = new Date();
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      lastFetchDate: now.toISOString().split('T')[0] // YYYY-MM-DD
    };
    localStorage.setItem(options.key, JSON.stringify(cacheData));
    console.log(`💾 Data cached for "${options.key}" (valid until tomorrow ${options.refreshHour || 8}am)`);
  } catch (error) {
    console.error(`Error setting cache for "${options.key}":`, error);
  }
}

/**
 * Clear cached data from localStorage
 * Useful for development and testing
 */
export function clearCachedData(options: CacheOptions): void {
  try {
    localStorage.removeItem(options.key);
    console.log(`🗑️ Cache cleared for "${options.key}"`);
  } catch (error) {
    console.error(`Error clearing cache for "${options.key}":`, error);
  }
}

/**
 * Get cache info without loading the data
 * Useful for debugging
 */
export function getCacheInfo(options: CacheOptions): {
  exists: boolean;
  lastFetchDate?: string;
  timestamp?: number;
  isExpired?: boolean;
} {
  try {
    const cached = localStorage.getItem(options.key);
    if (!cached) return { exists: false };

    const cacheData: CacheData<unknown> = JSON.parse(cached);
    return {
      exists: true,
      lastFetchDate: cacheData.lastFetchDate,
      timestamp: cacheData.timestamp,
      isExpired: shouldFetchData(cacheData, options.refreshHour),
    };
  } catch (error) {
    console.error(`Error reading cache info for "${options.key}":`, error);
    return { exists: false };
  }
}

