import { useState, useCallback } from 'react';
import { useRegions, useCategories } from '../hooks/useLookups';
import { debounce } from '../lib/utils';

export default function SearchFilters({ filters, onFiltersChange }) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300),
    [filters, onFiltersChange]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

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

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchInput}
              onChange={handleSearchChange}
              className="input pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
        </div>

        {/* Category filter */}
        <div className="sm:w-40">
          <select
            value={filters.category || ''}
            onChange={handleCategoryChange}
            className="input"
            disabled={categoriesLoading}
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Region filter */}
        <div className="sm:w-40">
          <select
            value={filters.region || ''}
            onChange={handleRegionChange}
            className="input"
            disabled={regionsLoading}
          >
            <option value="">All Regions</option>
            {regions?.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn-secondary text-sm whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
