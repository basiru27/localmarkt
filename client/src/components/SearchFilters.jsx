import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRegions, useCategories } from '../hooks/useLookups';
import { debounce } from '../lib/utils';

export default function SearchFilters({ filters, onFiltersChange }) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Sync searchInput with filters.search when it changes externally
  // (e.g., back/forward navigation, clearing filters)
  useEffect(() => {
    // Only sync if the external value differs from local input
    // This prevents overwriting while user is typing
    if (filters.search !== searchInput && filters.search !== undefined) {
      setSearchInput(filters.search);
    } else if (filters.search === undefined && searchInput !== '') {
      // Handle case when search is cleared externally
      setSearchInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // Debounced search handler - use useMemo to create a stable debounced function
  const debouncedSearch = useMemo(
    () => debounce((value, currentFilters, onChange) => {
      onChange({ ...currentFilters, search: value || undefined });
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value, filters, onFiltersChange);
  }, [debouncedSearch, filters, onFiltersChange]);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, category: value || undefined });
  };

  const handleRegionChange = (e) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, region: value || undefined });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.search || filters.category || filters.region;
  const activeFilterCount = [filters.search, filters.category, filters.region].filter(Boolean).length;

  return (
    <div className="card-static p-4 sm:p-5 mb-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
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
            type="search"
            placeholder="Search for products, services..."
            value={searchInput}
            onChange={handleSearchChange}
            className="input pl-12 pr-10 py-3 text-base"
            aria-label="Search listings"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ ...filters, search: undefined });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Toggle Button - Mobile */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="sm:hidden btn-secondary px-3 relative min-w-[44px] min-h-[44px]"
          aria-expanded={isExpanded}
          aria-controls="mobile-filters"
          aria-label={`${isExpanded ? 'Hide' : 'Show'} filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center" aria-hidden="true">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop Filters */}
        <div className="hidden sm:flex gap-3">
          {/* Category filter */}
          <div className="w-44 relative">
            <label htmlFor="category-filter" className="sr-only">Filter by category</label>
            <select
              id="category-filter"
              value={filters.category || ''}
              onChange={handleCategoryChange}
              className="input py-3"
              disabled={categoriesLoading}
              aria-busy={categoriesLoading}
            >
              <option value="">{categoriesLoading ? 'Loading...' : 'All Categories'}</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categoriesLoading && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Region filter */}
          <div className="w-44 relative">
            <label htmlFor="region-filter" className="sr-only">Filter by region</label>
            <select
              id="region-filter"
              value={filters.region || ''}
              onChange={handleRegionChange}
              className="input py-3"
              disabled={regionsLoading}
              aria-busy={regionsLoading}
            >
              <option value="">{regionsLoading ? 'Loading...' : 'All Regions'}</option>
              {regions?.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            {regionsLoading && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn-ghost text-sm px-3 text-text-secondary hover:text-error min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile Expanded Filters */}
      {isExpanded && (
        <div id="mobile-filters" className="sm:hidden mt-4 pt-4 border-t border-border animate-fade-in-down">
          <div className="space-y-3">
            {/* Category filter */}
            <div>
              <label htmlFor="mobile-category-filter" className="label">Category</label>
              <div className="relative">
                <select
                  id="mobile-category-filter"
                  value={filters.category || ''}
                  onChange={handleCategoryChange}
                  className="input"
                  disabled={categoriesLoading}
                  aria-busy={categoriesLoading}
                >
                  <option value="">{categoriesLoading ? 'Loading categories...' : 'All Categories'}</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categoriesLoading && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>

            {/* Region filter */}
            <div>
              <label htmlFor="mobile-region-filter" className="label">Region</label>
              <div className="relative">
                <select
                  id="mobile-region-filter"
                  value={filters.region || ''}
                  onChange={handleRegionChange}
                  className="input"
                  disabled={regionsLoading}
                  aria-busy={regionsLoading}
                >
                  <option value="">{regionsLoading ? 'Loading regions...' : 'All Regions'}</option>
                  {regions?.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {regionsLoading && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="btn-secondary w-full min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-light" role="list" aria-label="Active filters">
          {filters.search && (
            <span className="badge-primary flex items-center gap-1.5" role="listitem">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search: "{filters.search}"</span>
              <button
                onClick={() => {
                  setSearchInput('');
                  onFiltersChange({ ...filters, search: undefined });
                }}
                className="ml-1 hover:text-primary-dark p-0.5"
                aria-label={`Remove search filter: ${filters.search}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
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
          {filters.region && regions && (
            <span className="badge-primary flex items-center gap-1.5" role="listitem">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>Region: {regions.find(r => r.id === filters.region)?.name}</span>
              <button
                onClick={() => onFiltersChange({ ...filters, region: undefined })}
                className="ml-1 hover:text-primary-dark p-0.5"
                aria-label={`Remove region filter: ${regions.find(r => r.id === filters.region)?.name}`}
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
