/**
 * Search Bar Component
 *
 * Global search with autocomplete and recent searches
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchBarProps, SearchResult } from '../../../types/navigation';

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  onResultClick,
  recentSearches = [],
  isOpen = false,
  onToggle,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await onSearch(searchQuery);
      setResults(searchResults);
      setShowResults(true);
    } catch {
      // Error handling
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        void handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (searchRef.current && !searchRef.current.contains(event.target as HTMLElement)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultSelect = (result: SearchResult) => {
    onResultClick(result);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className={`search-bar ${isOpen ? 'open' : ''} ${className}`}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (onToggle && !isOpen) {onToggle();}
            if (query || recentSearches.length > 0) {
              setShowResults(true);
            }
          }}
        />
        {isLoading && (
          <motion.span
            className="search-loading"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            ⟳
          </motion.span>
        )}
        {query && !isLoading && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {showResults && (results.length > 0 || recentSearches.length > 0) && (
          <motion.div
            className="search-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Recent searches */}
            {!query && recentSearches.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Recent Searches</div>
                {recentSearches.slice(0, 5).map((recent) => (
                  <div
                    key={recent}
                    className="search-result recent"
                    onClick={() => setQuery(recent)}
                  >
                    <span className="result-icon">🕐</span>
                    <span className="result-text">{recent}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">
                  Results ({results.length})
                </div>
                {results.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="search-result"
                    onClick={() => handleResultSelect(result)}
                  >
                    <span className="result-icon">{result.icon || '📄'}</span>
                    <div className="result-content">
                      <div className="result-title">{result.title}</div>
                      {result.subtitle && (
                        <div className="result-subtitle">{result.subtitle}</div>
                      )}
                    </div>
                    {result.category && (
                      <span className="result-category">{result.category}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {query && results.length === 0 && !isLoading && (
              <div className="search-empty">
                <span className="empty-icon">🔍</span>
                <p className="empty-text">No results found for &quot;{query}&quot;</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .search-bar {
          position: relative;
          width: 300px;
          transition: width 0.3s;
        }

        .search-bar.open {
          width: 400px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          transition: all 0.2s;
        }

        .search-input-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.08);
          border-color: #00f5ff;
          box-shadow: 0 0 0 3px rgba(0, 245, 255, 0.1);
        }

        .search-icon {
          font-size: 1rem;
          margin-right: 0.5rem;
          opacity: 0.5;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 0.875rem;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .search-loading {
          font-size: 1rem;
          margin-left: 0.5rem;
          opacity: 0.5;
        }

        .search-clear {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.25rem;
          margin-left: 0.5rem;
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .search-clear:hover {
          color: #fff;
        }

        .search-results {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          right: 0;
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          max-height: 400px;
          overflow-y: auto;
          z-index: 1200;
        }

        .search-section {
          padding: 0.5rem 0;
        }

        .search-section + .search-section {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-section-title {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .search-result {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .search-result:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .result-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .result-content {
          flex: 1;
          min-width: 0;
        }

        .result-title {
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          margin-top: 0.125rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-category {
          font-size: 0.625rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background: rgba(0, 245, 255, 0.1);
          color: #00f5ff;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .search-empty {
          padding: 2rem 1rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 2rem;
          opacity: 0.3;
          display: block;
          margin-bottom: 0.5rem;
        }

        .empty-text {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
          margin: 0;
        }

        /* Scrollbar styling */
        .search-results::-webkit-scrollbar {
          width: 6px;
        }

        .search-results::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        .search-results::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .search-results::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .search-bar {
            width: 200px;
          }

          .search-bar.open {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;
