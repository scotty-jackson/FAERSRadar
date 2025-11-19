/**
 * Recent searches component
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  getRecentSearches,
  clearRecentSearches,
  removeRecentSearch,
  type RecentSearch,
} from '@/lib/recentSearches';

export default function RecentSearches() {
  const router = useRouter();
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setSearches(getRecentSearches());
  }, []);

  const handleSearchClick = (query: string) => {
    router.push(`/drug/${encodeURIComponent(query)}`);
  };

  const handleRemove = (query: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeRecentSearch(query);
    setSearches(getRecentSearches());
  };

  const handleClearAll = () => {
    clearRecentSearches();
    setSearches([]);
  };

  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <button
            key={search.query}
            onClick={() => handleSearchClick(search.query)}
            className="group inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2 text-gray-400 group-hover:text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">{search.query}</span>
            <button
              onClick={(e) => handleRemove(search.query, e)}
              className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
              aria-label={`Remove ${search.query}`}
            >
              ×
            </button>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Click to view drug dashboard • Searches are saved for 30 days
      </p>
    </div>
  );
}
