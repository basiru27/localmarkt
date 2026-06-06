import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Search, X, Clock } from 'lucide-react';
import { useSuggestions } from '../hooks/useSuggestions';
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
} from '../lib/searchHistory';

export default function SearchInput({
  placeholder = 'Search...',
  onSearch,
  className = '',
  inputClassName = '',
  autoFocus = false,
}) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState(getSearchHistory());
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const location = useLocation();

  // Close dropdown on route navigation
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsOpen(false); setShowHistory(false); }, [location.pathname]);

  // Debounce input value
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  const { data: suggestions = [], isLoading: suggestionsLoading } = useSuggestions(
    debouncedValue.trim().length >= 2 ? debouncedValue.trim() : null
  );

  const refreshHistory = useCallback(() => {
    setHistoryItems(getSearchHistory());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setIsOpen(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Show/hide dropdown based on input value and focus
  const shouldShowSuggestions = isOpen && inputValue.trim().length >= 2 && suggestions.length > 0;
  const shouldShowHistory = isOpen && inputValue.trim().length === 0 && showHistory && historyItems.length > 0;
  const shouldShowLoading = isOpen && inputValue.trim().length >= 2 && suggestionsLoading;
  const shouldShowEmpty = isOpen && inputValue.trim().length >= 2 && !suggestionsLoading && suggestions.length === 0;
  const showDropdown = shouldShowSuggestions || shouldShowHistory || shouldShowLoading || shouldShowEmpty;

  // Position the portal dropdown at the input's location
  useLayoutEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const left = Math.max(rect.left, 8);
      const right = Math.min(left + rect.width, window.innerWidth - 8);
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${left}px`,
        width: `${right - left}px`,
        zIndex: 9999,
      });
    }
  }, [showDropdown]);

  // Recalculate position on scroll/resize while open
  useEffect(() => {
    if (!showDropdown) return;
    const recalc = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const left = Math.max(rect.left, 8);
        const right = Math.min(left + rect.width, window.innerWidth - 8);
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${left}px`,
          width: `${right - left}px`,
          zIndex: 9999,
        });
      }
    };
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [showDropdown]);

  const submitSearch = (query) => {
    if (!query || !query.trim()) return;
    const trimmed = query.trim();
    addToSearchHistory(trimmed);
    refreshHistory();
    setInputValue(trimmed);
    setIsOpen(false);
    setShowHistory(false);
    inputRef.current?.blur();
    onSearch(trimmed);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);

    if (value.trim().length === 0) {
      setIsOpen(true);
      setShowHistory(true);
      refreshHistory();
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!inputValue.trim()) {
      refreshHistory();
      setShowHistory(historyItems.length > 0);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'Enter') {
        e.preventDefault();
        inputRef.current?.blur();
        submitSearch(inputValue);
      }
      return;
    }

    const items = shouldShowSuggestions ? suggestions : historyItems;
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          if (shouldShowSuggestions) {
            const selected = suggestions[selectedIndex];
            submitSearch(selected.suggestion);
          } else if (shouldShowHistory) {
            const selected = historyItems[selectedIndex];
            submitSearch(selected);
          }
        } else {
          submitSearch(inputValue);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setShowHistory(false);
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    submitSearch(suggestion);
  };

  const handleHistoryClick = (item) => {
    submitSearch(item);
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedIndex(-1);
    setIsOpen(false);
    setShowHistory(false);
    inputRef.current?.focus();
    onSearch('');
  };

  const handleRemoveHistoryItem = (e, item) => {
    e.stopPropagation();
    removeFromSearchHistory(item);
    refreshHistory();
    if (historyItems.length <= 1) {
      setShowHistory(false);
    }
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistoryItems([]);
    setShowHistory(false);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className="font-semibold text-text">{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          className={`w-full focus:outline-none transition-all ${inputClassName || 'pl-10 pr-10'}`}
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
            aria-label="Clear search"
            type="button"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          id="search-suggestions"
          role="listbox"
          className="bg-white rounded-xl shadow-xl border border-gray-200 py-1 overflow-hidden"
          style={{ ...dropdownStyle, maxHeight: 'min(400px, calc(100vh - 120px))', overflowY: 'auto' }}
        >
          {/* Recent searches header */}
          {shouldShowHistory && (
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recent searches
              </span>
              <button
                onClick={handleClearHistory}
                className="text-xs text-[#C8622A] hover:text-[#B5561F] font-medium"
              >
                Clear
              </button>
            </div>
          )}

          {/* Recent searches */}
          {shouldShowHistory && historyItems.map((item, idx) => (
            <div
              key={item}
              id={`suggestion-${idx}`}
              role="option"
              aria-selected={selectedIndex === idx}
              className={`flex items-center px-4 py-2 cursor-pointer group ${
                selectedIndex === idx ? 'bg-[#FEF3E8]' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleHistoryClick(item)}
              onMouseEnter={() => setSelectedIndex(-1)}
            >
              <Clock size={16} className="text-gray-400 shrink-0 mr-3" />
              <span className="flex-1 text-sm text-text truncate">{item}</span>
              <button
                onClick={(e) => handleRemoveHistoryItem(e, item)}
                className="p-1.5 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove "${item}" from history`}
              >
                <X size={12} className="text-gray-400" />
              </button>
            </div>
          ))}

          {/* Suggestions */}
          {shouldShowSuggestions && suggestions.map((item, idx) => (
            <div
              key={`${item.suggestion}-${item.category}`}
              id={`suggestion-${idx}`}
              role="option"
              aria-selected={selectedIndex === idx}
              className={`flex items-center px-4 py-2.5 cursor-pointer ${
                selectedIndex === idx ? 'bg-[#FEF3E8]' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionClick(item.suggestion)}
              onMouseEnter={() => setSelectedIndex(-1)}
            >
              <Search size={16} className="text-gray-400 shrink-0 mr-3" />
              <span className="flex-1 text-sm text-text truncate">
                {highlightMatch(item.suggestion, inputValue.trim())}
              </span>
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                {item.category}
              </span>
            </div>
          ))}

          {/* Loading skeleton */}
          {shouldShowLoading && (
            <div className="px-4 py-3 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {shouldShowEmpty && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No suggestions — press Enter to search anyway
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
