/**
 * Drug search bar with typeahead
 */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { searchDrugs, DrugSearchResult } from '@/lib/api';

export default function DrugSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const data = await searchDrugs(query, 10);
          setResults(data.results);
          setShowResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (drugName: string) => {
    router.push(`/drug/${encodeURIComponent(drugName)}`);
    setShowResults(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a drug (e.g., aspirin, lipitor, ozempic)..."
          className="w-full px-4 py-3 pl-12 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
        />
        <svg
          className="absolute left-4 top-4 h-6 w-6 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        {isLoading && (
          <div className="absolute right-4 top-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.product_name_normalized}
              onClick={() => handleSelect(result.product_name_normalized)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="font-semibold text-gray-900">
                {result.product_name_normalized}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {result.total_case_count.toLocaleString()} reports
                {result.serious_case_count > 0 && (
                  <span className="ml-2 text-orange-600">
                    ({result.serious_case_count.toLocaleString()} serious)
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No drugs found matching "{query}"
        </div>
      )}
    </div>
  );
}
