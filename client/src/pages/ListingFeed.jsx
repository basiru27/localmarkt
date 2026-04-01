import { useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { ListingGridSkeleton } from '../components/ListingCardSkeleton';
import SearchFilters from '../components/SearchFilters';

import Pagination from '../components/Pagination';

export default function ListingFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Derive filters directly from URL params (single source of truth)
  const filters = useMemo(() => {
    const params = {};
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sort = searchParams.get('sort');

    if (search) params.search = search;
    if (category) params.category = category;
    if (region) params.region = region;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (sort) params.sort = sort;

    return params;
  }, [searchParams]);

  // Update URL when filters change
  const handleFiltersChange = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.region) params.set('region', newFilters.region);
    if (newFilters.limit) params.set('limit', newFilters.limit);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    
    // Always reset to page 1 on filter changes
    params.set('page', 1);
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const handlePageChange = useCallback((page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const { data: listingsData, isLoading, isError, error } = useListings(filters);
  const listings = listingsData?.data;
  const pagination = listingsData?.pagination;

  const { isOnline } = useOffline();
  const { isAuthenticated } = useAuth();

  const hasActiveFilters = filters.search || filters.category || filters.region;

  return (
    <div>
      {/* Hero section - only on home page without filters */}
      {!hasActiveFilters && (
        <div className="hero-gradient text-white py-12 sm:py-16 mb-6">
          <div className="container-app relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                Buy & Sell Locally in{' '}
                <span className="text-secondary-light">The Gambia</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
                Your trusted marketplace for products and services. Connect with your community today.
              </p>
              {!isAuthenticated && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/register"
                    className="btn bg-white text-primary font-semibold px-8 py-3 hover:bg-gray-100 shadow-lg"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="btn border-2 border-white/30 text-white px-8 py-3 hover:bg-white/10"
                  >
                    Log In
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <Link
                  to="/listings/new"
                  className="btn bg-white text-primary font-semibold px-8 py-3 hover:bg-gray-100 shadow-lg inline-flex"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Listing
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-10 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">{listings?.length || '0'}+</div>
                <div className="text-sm text-white/80">Listings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-white/80">Regions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-white/80">Available</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-app py-4 sm:py-6">
        {/* Page title when filters are active */}
        {hasActiveFilters && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text">Search Results</h1>
            <p className="text-text-secondary">Browse filtered listings</p>
          </div>
        )}

        {/* Search and filters - key ensures re-render on URL change (back/forward) */}
        <SearchFilters 
          key={filters.search || 'no-search'} 
          filters={filters} 
          onFiltersChange={handleFiltersChange} 
        />

        {/* Offline notice */}
        {!isOnline && listings && (
          <div className="alert alert-warning mb-6 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">You're offline</p>
              <p className="text-sm opacity-90">Showing cached data. Some listings may not be up to date.</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton w-32 h-5 rounded" />
            </div>
            <ListingGridSkeleton count={8} />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="empty-state py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Failed to load listings</h3>
            <p className="text-text-secondary mb-6 max-w-sm">
              {error?.message || 'Something went wrong. Please check your connection and try again.'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        )}

        {/* Listings grid */}
        {!isLoading && !isError && listings && (
          <>
            {listings.length === 0 ? (
              <div className="empty-state py-16 animate-fade-in">
                <div className="empty-state-icon">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text mb-2">No listings found</h3>
                <p className="text-text-secondary mb-6 max-w-sm">
                  {hasActiveFilters
                    ? "We couldn't find any listings matching your search. Try adjusting your filters."
                    : "Be the first to post a listing and start selling to your community!"}
                </p>
                {hasActiveFilters ? (
                  <button 
                    onClick={() => handleFiltersChange({})} 
                    className="btn-secondary"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>
                ) : isAuthenticated ? (
                  <Link to="/listings/new" className="btn-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post a Listing
                  </Link>
                ) : (
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-text-secondary">
                    <span className="text-text font-semibold">{listings.length}</span> listing{listings.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {listings.map((listing, index) => (
                    <ListingCard key={listing.id} listing={listing} index={index} />
                  ))}
                </div>
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
