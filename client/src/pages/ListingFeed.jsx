import { useState } from 'react';
import { useListings } from '../hooks/useListings';
import { useOffline } from '../context/OfflineContext';
import ListingCard from '../components/ListingCard';
import { ListingGridSkeleton } from '../components/ListingCardSkeleton';
import SearchFilters from '../components/SearchFilters';

export default function ListingFeed() {
  const [filters, setFilters] = useState({});
  const { data: listings, isLoading, isError, error } = useListings(filters);
  const { isOnline } = useOffline();

  return (
    <div className="container-app py-4 sm:py-6">
      {/* Hero section - only on home page without filters */}
      {!filters.search && !filters.category && !filters.region && (
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            Gambia Marketplace
          </h1>
          <p className="text-text-secondary text-sm sm:text-base">
            Buy and sell locally in The Gambia
          </p>
        </div>
      )}

      {/* Search and filters */}
      <SearchFilters filters={filters} onFiltersChange={setFilters} />

      {/* Offline notice */}
      {!isOnline && listings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
          Showing cached data. Some listings may not be up to date.
        </div>
      )}

      {/* Loading state */}
      {isLoading && <ListingGridSkeleton count={8} />}

      {/* Error state */}
      {isError && (
        <div className="text-center py-12">
          <div className="text-error mb-2">Failed to load listings</div>
          <p className="text-text-secondary text-sm">
            {error?.message || 'Please try again later'}
          </p>
        </div>
      )}

      {/* Listings grid */}
      {!isLoading && !isError && listings && (
        <>
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-medium text-text mb-1">No listings found</h3>
              <p className="text-text-secondary text-sm">
                {filters.search || filters.category || filters.region
                  ? 'Try adjusting your filters'
                  : 'Be the first to post a listing!'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-3">
                {listings.length} listing{listings.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
