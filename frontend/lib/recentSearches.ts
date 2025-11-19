/**
 * Recent searches utility using localStorage
 */

const STORAGE_KEY = 'faers_recent_searches';
const MAX_RECENT = 10;

export interface RecentSearch {
  query: string;
  timestamp: number;
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const searches: RecentSearch[] = JSON.parse(stored);
    // Filter out old searches (older than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return searches.filter((s) => s.timestamp > thirtyDaysAgo);
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
}

/**
 * Add a search to recent searches
 */
export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const searches = getRecentSearches();

    // Remove duplicates (case-insensitive)
    const filtered = searches.filter(
      (s) => s.query.toLowerCase() !== query.toLowerCase()
    );

    // Add new search at the beginning
    const updated: RecentSearch[] = [
      { query: query.trim(), timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
}

/**
 * Remove a specific search from recent searches
 */
export function removeRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;

  try {
    const searches = getRecentSearches();
    const filtered = searches.filter(
      (s) => s.query.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing recent search:', error);
  }
}
