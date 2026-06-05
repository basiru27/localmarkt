import useDocumentTitle from '../hooks/useDocumentTitle';
import { useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useListings, useListingStats } from '../hooks/useListings';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import { SearchX } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { ListingGridSkeleton } from '../components/ListingCardSkeleton';
import SearchFilters from '../components/SearchFilters';
import SearchInput from '../components/SearchInput';

import Pagination from '../components/ui/Pagination';

export default function ListingFeed() {
  useDocumentTitle('');

  const [searchParams, setSearchParams] = useSearchParams();
  
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

  const handlePageChange = useCallback((page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
    // Scroll to top of listings for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const { data: listingsData, isLoading, isFetching, isError, error } = useListings(filters);
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
        <div className="hero-gradient text-white py-4 md:py-10">
          <div className="container-app relative z-10 px-4 md:px-0">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="hidden md:block text-2xl md:text-4xl font-bold mb-2 leading-tight !text-white">
                Buy & Sell in The Gambia
              </h1>
              
              <p className="hidden md:block text-white/80 text-base mt-2 mb-6">
                The Gambia's trusted buy &amp; sell community.
              </p>
              
              <div className="block md:hidden mb-4">
                <SearchInput
                  placeholder="Search in The Gambia..."
                  onSearch={(q) => {
                    if (q) handleFiltersChange({ search: q });
                  }}
                  inputClassName="pl-10 pr-10 h-12 bg-white rounded-2xl text-gray-900 shadow-lg placeholder:text-gray-400 border-0"
                />
              </div>

              {isAuthenticated && (
                <Link
                  to="/listings/new"
                  className="btn bg-[#C8622A] hover:bg-[#B5561F] text-white font-semibold px-8 py-2.5 rounded-xl shadow-lg hidden w-full max-w-xs mx-auto md:w-auto md:inline-flex justify-center text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Listing
                </Link>
              )}
            </div>

            {/* Stats - desktop only */}
            <div className="hidden md:grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto mt-10 text-center">
              <div className="stat-pill flex flex-col justify-center px-2 py-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {isStatsLoading ? (
                    <span className="inline-block w-[40px] h-[18px] bg-white/20 rounded-full animate-pulse" />
                  ) : (
                    statsData?.totalListings > 10 ? `${Math.floor(statsData.totalListings / 10) * 10}+` : (statsData?.totalListings || 0)
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-white/70 mt-1 uppercase tracking-wide">Listings</div>
              </div>
              <div className="stat-pill flex flex-col justify-center px-2 py-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {isStatsLoading ? (
                    <span className="inline-block w-[40px] h-[18px] bg-white/20 rounded-full animate-pulse" />
                  ) : (
                    statsData?.activeAreas > 10 ? `${Math.floor(statsData.activeAreas / 10) * 10}+` : (statsData?.activeAreas || 0)
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-white/70 mt-1 uppercase tracking-wide">Areas</div>
              </div>
              <div className="stat-pill flex flex-col justify-center px-2 py-4">
                <div className="text-xl sm:text-2xl font-bold">
                  {isStatsLoading ? (
                    <span className="inline-block w-[40px] h-[18px] bg-white/20 rounded-full animate-pulse" />
                  ) : (
                    statsData?.activeSellers > 10 ? `${Math.floor(statsData.activeSellers / 10) * 10}+` : (statsData?.activeSellers || 0)
                  )}
                </div>
                <div className="text-[10px] sm:text-xs text-white/70 mt-1 uppercase tracking-wide">Sellers</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-app py-4 sm:py-6">
        {/* Page title when filters are active */}
        {hasActiveFilters && (
          <div className="mb-4">
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
                  {pagination?.total || listings?.length || 0} listing{(pagination?.total || listings?.length || 0) !== 1 ? 's' : ''} from this seller
                </p>
              </>
            ) : null}
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

        {/* Initial load — show skeleton when no data yet */}
        {isLoading && !listings && (
          <div>
            <ListingGridSkeleton count={8} />
          </div>
        )}

        {/* Error state */}
        {isError && !listings && (
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

        {/* Listings grid — always show when data exists, with overlay during refetch */}
        {listings && (
          <>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-5">
                  <SearchX size={32} className="text-[#C8622A]" />
                </div>
                <h3 className="text-xl font-bold text-text mb-1">
                  {filters.search ? (
                    <>No results for &ldquo;<span className="text-[#C8622A]">{filters.search}</span>&rdquo;</>
                  ) : (
                    'No listings found'
                  )}
                </h3>
                <p className="text-text-secondary mb-2 max-w-sm">
                  Try checking your spelling or use a more general term
                </p>
                <button
                  onClick={() => setSearchParams({})}
                  className="text-sm text-[#C8622A] hover:text-[#B5561F] font-medium mt-2 hover:underline"
                >
                  Browse all listings &rarr;
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {filters.search ? (
                      <p className="text-base font-semibold text-text">
                        Search results for &ldquo;<span className="text-[#C8622A]">{filters.search}</span>&rdquo;
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-text-secondary">
                        <span className="text-text font-semibold">{listings.length}</span> listing{listings.length !== 1 ? 's' : ''} found
                      </p>
                    )}
                    {filters.search && (
                      <button
                        onClick={() => handleFiltersChange({ search: undefined })}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#C8622A] bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-full transition-colors"
                      >
                        <SearchX size={12} />
                        Clear search
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
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
                {listings.length <= 3 && filters.search && (
                  <p className="text-sm text-text-secondary mb-4">
                    Only {listings.length} result{listings.length !== 1 ? 's' : ''} found. Try a different search term.
                  </p>
                )}
                <div className={`relative ${isFetching && !isLoading ? 'opacity-50' : ''}`}>
                  {isFetching && !isLoading && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="w-5 h-5 border-2 border-[#C8622A] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {listings.map((listing, index) => (
                      <ListingCard key={listing.id} listing={listing} index={index} />
                    ))}
                  </div>
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
