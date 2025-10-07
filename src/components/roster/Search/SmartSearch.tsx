/**
 * SmartSearch Component
 *
 * Intelligent search component with suggestions and history
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, History, Clock } from 'lucide-react';
import type { SmartSearchProps } from '../../../types/roster';

export default function SmartSearch({
  searchQuery,
  searchHistory,
  onSearchChange,
  onClearHistory,
  placeholder = 'Search players...',
  autoFocus = false,
  className = '',
}: SmartSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleClear = useCallback(() => {
    onSearchChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onSearchChange]);

  const handleHistoryClick = useCallback(
    (historyItem: string) => {
      onSearchChange(historyItem);
      setShowSuggestions(false);
    },
    [onSearchChange],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay to allow clicking suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const filteredHistory = searchHistory.filter(
    item => item.toLowerCase().includes(searchQuery.toLowerCase()) && item !== searchQuery,
  );

  return (
    <div className={`smart-search ${className}`}>
      <div className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}>
        <Search className="search-icon" size={20} />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {searchQuery && (
          <button className="clear-button" onClick={handleClear} type="button">
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && filteredHistory.length > 0 && (
        <div className="search-suggestions">
          <div className="suggestions-header">
            <div className="suggestions-title">
              <History size={16} />
              <span>Recent Searches</span>
            </div>
            <button className="clear-history-button" onClick={onClearHistory} type="button">
              Clear
            </button>
          </div>
          <div className="suggestions-list">
            {filteredHistory.slice(0, 5).map((item, index) => (
              <button
                key={`history-${item}-${index}`}
                className="suggestion-item"
                onClick={() => handleHistoryClick(item)}
                type="button"
              >
                <Clock size={14} />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .smart-search {
          position: relative;
          width: 100%;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 16px;
          transition: all 0.2s ease;
        }

        .search-input-wrapper.focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-icon {
          color: #9ca3af;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          color: #1f2937;
          background: transparent;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .clear-button {
          padding: 4px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .search-suggestions {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 50;
          overflow: hidden;
        }

        .suggestions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .suggestions-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .clear-history-button {
          padding: 4px 8px;
          background: none;
          border: none;
          font-size: 13px;
          color: #ef4444;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .clear-history-button:hover {
          background: #fef2f2;
        }

        .suggestions-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .suggestion-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          text-align: left;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-item:hover {
          background: #f9fafb;
        }

        .suggestion-item svg {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .suggestion-item span {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
