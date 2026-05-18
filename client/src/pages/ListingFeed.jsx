import { useMemo, useCallback, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useListings, useListingStats } from '../hooks/useListings';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import { SearchX } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { ListingGridSkeleton } from '../components/ListingCardSkeleton';
import SearchFilters from '../components/SearchFilters';

import Pagination from '../components/Pagination';

export default function ListingFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');
  
  // Derive filters directly from URL params (single source of truth)
  const filters = useMemo(() => {
    const params = {};
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const area_id = searchParams.get('area_id');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sort = searchParams.get('sort');
    const user_id = searchParams.get('user_id');

    if (search) params.search = search;
    if (category) params.category = category;
    if (area_id) params.area_id = area_id;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (sort) params.sort = sort;
    if (user_id) params.user_id = user_id;

    return params;
  }, [searchParams]);

  // Update URL when filters change
  const handleFiltersChange = useCallback((newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.area_id) params.set('area_id', newFilters.area_id);
    if (newFilters.limit) params.set('limit', newFilters.limit);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.user_id) params.set('user_id', newFilters.user_id);
    
    // Always reset to page 1 on filter changes
    params.set('page', 1);
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      handleFiltersChange({ search: heroSearch });
    }
  };

  const handlePageChange = useCallback((page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
    // Scroll to top of listings for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const { data: listingsData, isLoading, isError, error } = useListings(filters);
  const listings = listingsData?.data;
  const pagination = listingsData?.pagination;
  const { data: statsData, isLoading: isStatsLoading } = useListingStats();

  const { isOnline } = useOffline();
  const { isAuthenticated } = useAuth();

  const hasActiveFilters = filters.search || filters.category || filters.area_id || filters.user_id;
  const isSellerFilter = !!filters.user_id;

  return (
    <div>
      {/* Hero section - only on home page without filters */}
      {!hasActiveFilters && (
        <div className="hero-gradient text-white py-12 sm:py-16 mb-6">
          <div className="container-app relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight !text-white">
                Buy & Sell in The Gambia
              </h1>
              <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed">
                Your trusted marketplace for products and services. Connect with your community today.
              </p>
              
              <form onSubmit={handleHeroSearch} className="max-w-[600px] mx-auto mb-8 relative flex items-center">
                <div className="absolute left-4 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search products in The Gambia..."
                  className="w-full bg-white text-gray-900 rounded-2xl py-3 px-5 pl-12 pr-32 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#C8622A] focus:border-[#C8622A]"
                />
                <button
                  type="submit"
                  className="absolute right-2 bg-[#C8622A] hover:bg-[#B5561F] text-white font-semibold py-2 px-6 rounded-xl transition-colors"
                >
                  Search
                </button>
              </form>

              {isAuthenticated && (
                <Link
                  to="/listings/new"
                  className="btn bg-[#C8622A] hover:bg-[#B5561F] text-white font-semibold px-8 py-3 rounded-xl shadow-lg inline-flex transition-all duration-200"
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
              <div className="stat-pill flex flex-col justify-center">
                <div className="text-2xl font-bold">
                  {isStatsLoading ? (
                    <span className="inline-block w-[40px] h-[18px] bg-white/20 rounded-full animate-pulse" />
                  ) : (
                    statsData?.totalListings > 10 ? `${Math.floor(statsData.totalListings / 10) * 10}+` : (statsData?.totalListings || 0)
                  )}
                </div>
                <div className="text-xs text-white/70 mt-1 uppercase tracking-wide">Listings</div>
              </div>
              <div className="stat-pill flex flex-col justify-center">
                <div className="text-2xl font-bold">
                  {isStatsLoading ? (
                    <span className="inline-block w-[40px] h-[18px] bg-white/20 rounded-full animate-pulse" />
                  ) : (
                    statsData?.activeAreas > 10 ? `${Math.floor(statsData.activeAreas / 10) * 10}+` : (statsData?.activeAreas || 0)
                  )}
                </div>
                <div className="text-xs text-white/70 mt-1 uppercase tracking-wide">Areas</div>
              </div>
              <div className="stat-pill flex flex-col justify-center">
                <div className="text-2xl font-bold">
                  {isStatsLoading ? (
                    <span className="inline-block w-[40px] h-[18px] bg-white/20 rounded-full animate-pulse" />
                  ) : (
                    statsData?.activeSellers > 10 ? `${Math.floor(statsData.activeSellers / 10) * 10}+` : (statsData?.activeSellers || 0)
                  )}
                </div>
                <div className="text-xs text-white/70 mt-1 uppercase tracking-wide">Sellers</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-app py-4 sm:py-6">
        {/* Page title when filters are active */}
        {hasActiveFilters && (
          <div className="mb-6">
            {isSellerFilter ? (
              <>
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to all listings
                </Link>
                <h1 className="text-2xl font-bold text-text">
                  {listings?.[0]?.seller?.display_name || 'Seller'}'s Listings
                </h1>
                <p className="text-text-secondary">
                  {pagination?.totalItems || listings?.length || 0} listing{(pagination?.totalItems || listings?.length || 0) !== 1 ? 's' : ''} from this seller
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-text">Search Results</h1>
                <p className="text-text-secondary">Browse filtered listings</p>
              </>
            )}
          </div>
        )}

        {/* Search and filters */}
        <SearchFilters 
          filters={filters} 
          onFiltersChange={handleFiltersChange}
          hideSearch={!hasActiveFilters}
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
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <SearchX size={48} className="text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-text mb-1">No listings found</h3>
                
                {filters.search && (
                  <p className="text-lg text-text-secondary mb-2">
                    for "<span className="font-medium text-text">{filters.search}</span>"
                  </p>
                )}
                
                <p className="text-text-secondary mb-8">
                  Try a different search or browse all categories
                </p>
                
                <button 
                  onClick={() => setSearchParams({})} 
                  className="btn-secondary"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <p className="text-sm font-medium text-text-secondary">
                    <span className="text-text font-semibold">{listings.length}</span> listing{listings.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort-select" className="text-sm text-text-secondary font-medium whitespace-nowrap">Sort by:</label>
                    <select
                      id="sort-select"
                      className="input py-2 py-1.5 text-sm"
                      value={filters.sort || 'newest'}
                      onChange={(e) => handleFiltersChange({ ...filters, sort: e.target.value })}
                    >
                      <option value="newest">Newest first</option>
                      <option value="price_asc">Price: low to high</option>
                      <option value="price_desc">Price: high to low</option>
                      <option value="views">Most viewed</option>
                    </select>
                  </div>
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
