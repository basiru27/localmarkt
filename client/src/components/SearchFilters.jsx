import { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useZones, useAreas, useCategories } from '../hooks/useLookups';
import { debounce } from '../lib/utils';
import { listingsApi } from '../lib/api';
import { getSearchHistory, addToSearchHistory, removeFromSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import Modal from './Modal';

export default function SearchFilters({ filters, onFiltersChange, hideSearch = false }) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState(getSearchHistory());
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: areas, isLoading: areasLoading } = useAreas(selectedZone);
  const { data: categories } = useCategories();

  const refreshHistory = useCallback(() => {
    setHistoryItems(getSearchHistory());
  }, []);

  // Handle outside click and escape for suggestions + history
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Refresh history when it might have changed
  useEffect(() => {
    if (searchFocused && !searchInput) {
      setHistoryItems(getSearchHistory());
    }
  }, [searchFocused, searchInput]);

  // Sync searchInput with filters.search when it changes externally
  useEffect(() => {
    if (filters.search !== searchInput && filters.search !== undefined) {
      setSearchInput(filters.search);
    } else if (filters.search === undefined && searchInput !== '') {
      setSearchInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // When zone changes via external filter clear, reset
  useEffect(() => {
    if (!filters.area_id) {
      setSelectedZone('');
    }
  }, [filters.area_id]);

  const showSearchDropdown = showSuggestions || showHistory;

  // Position the portal dropdown at the search input
  useLayoutEffect(() => {
    if (showSearchDropdown && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      const dropdownWidth = Math.max(rect.width, 280);
      const overflows = rect.left + dropdownWidth > window.innerWidth;
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: overflows ? 'auto' : `${rect.left}px`,
        right: overflows ? `${window.innerWidth - rect.right}px` : 'auto',
        width: `${dropdownWidth}px`,
        zIndex: 9999,
      });
    }
  }, [showSearchDropdown]);

  // Recalculate position on scroll/resize while open
  useEffect(() => {
    if (!showSearchDropdown) return;
    const recalc = () => {
      if (searchInputRef.current) {
        const rect = searchInputRef.current.getBoundingClientRect();
        const dropdownWidth = Math.max(rect.width, 280);
        const overflows = rect.left + dropdownWidth > window.innerWidth;
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: overflows ? 'auto' : `${rect.left}px`,
          right: overflows ? `${window.innerWidth - rect.right}px` : 'auto',
          width: `${dropdownWidth}px`,
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
  }, [showSearchDropdown]);

  const debouncedSearch = useMemo(
    () => debounce((value, currentFilters, onChange) => {
      if (value && value.trim().length >= 2) {
        addToSearchHistory(value);
        refreshHistory();
      }
      onChange({ ...currentFilters, search: value || undefined });
    }, 300),
    [refreshHistory]
  );

  const fetchSuggestions = useMemo(
    () => debounce(async (value) => {
      if (value.length >= 2) {
        try {
          const res = await listingsApi.getSuggestions(value);
          setSuggestions(res || []);
          setShowSuggestions(true);
        } catch {
          // ignore
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (value) {
      setShowHistory(false);
    } else if (searchFocused) {
      refreshHistory();
      setShowHistory(getSearchHistory().length > 0);
    }
    debouncedSearch(value, filters, onFiltersChange);
    fetchSuggestions(value);
  }, [debouncedSearch, fetchSuggestions, filters, onFiltersChange, searchFocused, refreshHistory]);

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion);
    setShowSuggestions(false);
    addToSearchHistory(suggestion);
    refreshHistory();
    onFiltersChange({ ...filters, search: suggestion });
  };

  const handleZoneChange = (e) => {
    const value = e.target.value;
    setSelectedZone(value);
    // Clear area when zone changes
    onFiltersChange({ ...filters, area_id: undefined });
  };

  const handleAreaChange = (e) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, area_id: value || undefined });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedZone('');
    onFiltersChange({
      ...filters,
      search: undefined,
      category: undefined,
      area_id: undefined,
    });
  };

  const hasActiveFilters = filters.search || filters.category || filters.area_id;
  const activeFilterCount = [filters.search, filters.category, filters.area_id].filter(Boolean).length;

  const categoryNames = useMemo(() => ['All', ...(categories?.map(c => c.name) || [])], [categories]);

  const handleChipClick = (catName) => {
    if (catName === "All") {
      onFiltersChange({ ...filters, category: undefined });
    } else {
      const cat = categories?.find(c => c.name === catName);
      if (cat) {
        onFiltersChange({ ...filters, category: cat.id.toString() });
      }
    }
  };

  const activeCategoryName = filters.category && categories
    ? categories.find(c => c.id.toString() === filters.category.toString())?.name
    : "All";

  const selectedAreaName = filters.area_id && areas
    ? areas.find(a => a.id.toString() === filters.area_id.toString())?.name
    : null;

  const selectedZoneName = filters.area_id && zones
    ? zones.find(z => z.id.toString() === selectedZone)?.name
    : null;

  return (
    <div className="card-static p-3 sm:p-4 mb-4">
      {/* Category Chips */}
      <div className="relative mb-4">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categoryNames.map(name => {
            const isActive = activeCategoryName === name;
            return (
              <button
                key={name}
                onClick={() => handleChipClick(name)}
                className={`flex-shrink-0 px-4 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? 'bg-[#C8622A] text-white font-bold border border-transparent'
                    : 'bg-gray-100 text-gray-800 border border-transparent hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>

      {/* Search Bar */}
      {!hideSearch && (
        <div className="flex gap-3">
          <div className="flex-1 relative" ref={containerRef}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
            <svg
              className="w-5 h-5 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search for products, services..."
            value={searchInput}
            onChange={handleSearchChange}
            onFocus={() => {
              setSearchFocused(true);
              if (!searchInput) {
                const current = getSearchHistory();
                setHistoryItems(current);
                setShowHistory(current.length > 0);
              }
              if (suggestions.length > 0 && searchInput.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setSearchFocused(false), 200);
            }}
            className="input pl-12 pr-10 py-3 text-base"
            aria-label="Search listings"
            autoComplete="off"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ ...filters, search: undefined });
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && createPortal(
            <ul
              ref={dropdownRef}
              className="bg-white rounded-xl shadow-lg border border-[#F0EDE8] py-1 overflow-hidden"
              style={dropdownStyle}
            >
              {suggestions.map((suggestion, idx) => (
                <li 
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 hover:bg-[#FEF3E8] cursor-pointer flex items-center gap-3 text-text"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {suggestion}
                </li>
              ))}
            </ul>,
            document.body
          )}

          {showHistory && !searchInput && historyItems.length > 0 && createPortal(
            <div
              ref={dropdownRef}
              className="bg-white rounded-xl shadow-lg border border-[#F0EDE8] py-2 overflow-hidden"
              style={dropdownStyle}
            >
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Recent searches
              </div>
              {historyItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center px-4 py-2 hover:bg-[#FEF3E8] group"
                >
                  <button
                    onClick={() => {
                      setSearchInput(item);
                      setShowHistory(false);
                      addToSearchHistory(item);
                      refreshHistory();
                      onFiltersChange({ ...filters, search: item });
                    }}
                    className="flex-1 flex items-center gap-3 text-left text-text"
                  >
                    <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{item}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromSearchHistory(item);
                      refreshHistory();
                      if (historyItems.length <= 1) setShowHistory(false);
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove "${item}" from search history`}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  clearSearchHistory();
                  setHistoryItems([]);
                  setShowHistory(false);
                }}
                className="w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 text-left flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear all recent searches
              </button>
            </div>,
            document.body
          )}
        </div>

        {/* Filter Button - Mobile (opens bottom sheet) */}
        <button
          onClick={() => setShowFilterSheet(true)}
          className="sm:hidden btn-secondary relative"
          aria-expanded={showFilterSheet}
          aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="ml-1.5 text-sm font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center" aria-hidden="true">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop Filters */}
        <div className="hidden sm:flex gap-3">
          {/* Zone filter */}
          <div className="w-44 relative">
            <label htmlFor="zone-filter" className="sr-only">Filter by zone</label>
            <select
              id="zone-filter"
              value={selectedZone}
              onChange={handleZoneChange}
              className="input py-3"
              disabled={zonesLoading}
              aria-busy={zonesLoading}
            >
              <option value="">{zonesLoading ? 'Loading...' : 'All Zones'}</option>
              {zones?.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
            {zonesLoading && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#C8622A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Area filter */}
          <div className="w-44 relative">
            <label htmlFor="area-filter" className="sr-only">Filter by area</label>
            <select
              id="area-filter"
              value={filters.area_id || ''}
              onChange={handleAreaChange}
              className="input py-3"
              disabled={!selectedZone || areasLoading}
              aria-busy={areasLoading}
            >
              <option value="">{!selectedZone ? 'Select zone first' : areasLoading ? 'Loading...' : 'All Areas'}</option>
              {areas?.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            {areasLoading && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#C8622A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn-ghost text-text-secondary hover:text-error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <Modal
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        title="Filters"
        showCloseButton={true}
      >
        <div className="space-y-5">
          {/* Sort */}
          <div>
            <label htmlFor="filter-sort" className="label">Sort by</label>
            <select
              id="filter-sort"
              value={filters.sort || 'newest'}
              onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value })}
              className="input"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="views">Most viewed</option>
            </select>
          </div>

          {/* Zone filter */}
          <div>
            <label htmlFor="mobile-zone-filter" className="label">Zone</label>
            <div className="relative">
              <select
                id="mobile-zone-filter"
                value={selectedZone}
                onChange={handleZoneChange}
                className="input"
                disabled={zonesLoading}
                aria-busy={zonesLoading}
              >
                <option value="">{zonesLoading ? 'Loading zones...' : 'All Zones'}</option>
                {zones?.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              {zonesLoading && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#C8622A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          {/* Area filter */}
          <div>
            <label htmlFor="mobile-area-filter" className="label">Area</label>
            <div className="relative">
              <select
                id="mobile-area-filter"
                value={filters.area_id || ''}
                onChange={handleAreaChange}
                className="input"
                disabled={!selectedZone || areasLoading}
                aria-busy={areasLoading}
              >
                <option value="">{!selectedZone ? 'Select zone first' : areasLoading ? 'Loading...' : 'All Areas'}</option>
                {areas?.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {areasLoading && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#C8622A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 space-y-3">
            <button
              onClick={() => {
                setShowFilterSheet(false);
              }}
              className="btn-primary w-full"
            >
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  handleClearFilters();
                  setShowFilterSheet(false);
                }}
                className="w-full text-center text-sm text-text-secondary hover:text-text transition-colors py-2"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-light" role="list" aria-label="Active filters">

          {filters.category && categories && (
            <span className="badge-primary flex items-center gap-1.5" role="listitem">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Category: {categories.find(c => c.id === filters.category)?.name}</span>
              <button
                onClick={() => onFiltersChange({ ...filters, category: undefined })}
                className="ml-1 hover:text-primary-dark p-0.5"
                aria-label={`Remove category filter: ${categories.find(c => c.id === filters.category)?.name}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {filters.area_id && selectedAreaName && (
            <span className="badge-primary flex items-center gap-1.5" role="listitem">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>Area: {selectedZoneName ? `${selectedZoneName} → ` : ''}{selectedAreaName}</span>
              <button
                onClick={() => {
                  setSelectedZone('');
                  onFiltersChange({ ...filters, area_id: undefined });
                }}
                className="ml-1 hover:text-primary-dark p-0.5"
                aria-label={`Remove area filter: ${selectedAreaName}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
