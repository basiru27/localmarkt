import useDocumentTitle from '../hooks/useDocumentTitle';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useListings, useDeleteListing, useMarkAsSold, useBumpListing } from '../hooks/useListings';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatRelativeDate } from '../lib/utils';
import Modal, { ModalFooter } from '../components/Modal';
import Pagination from '../components/ui/Pagination';
import SafeImage from '../components/SafeImage';
import { Eye, MoreVertical, Edit3, Trash2, CheckCircle2, RotateCcw, ArrowUp } from 'lucide-react';

const TABS = [
  { key: 'active', label: 'Active', filters: { is_sold: 'false', moderation_status: 'approved' } },
  { key: 'sold', label: 'Sold', filters: { is_sold: 'true' } },
  { key: 'pending', label: 'Pending', filters: { moderation_status: 'pending_or_rejected' } },
];

export default function MyListings() {
  useDocumentTitle('My Listings');

  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [page, setPage] = useState(1);
  const [bumpedIds, setBumpedIds] = useState(new Set());
  const bumpedTimers = useRef({});
  const deleteMutation = useDeleteListing();
  const markAsSoldMutation = useMarkAsSold();
  const bumpMutation = useBumpListing();
  const [deleteModal, setDeleteModal] = useState({ open: false, listing: null });
  const [overflowMenuListingId, setOverflowMenuListingId] = useState(null);

  const currentTab = TABS.find(t => t.key === activeTab) || TABS[0];
  const { data: listingsData, isLoading, isError } = useListings({
    mine: true,
    limit: 10,
    page,
    ...currentTab.filters,
  });
  const myListings = listingsData?.data || [];
  const pagination = listingsData?.pagination;

  const handleDelete = async () => {
    if (!deleteModal.listing) return;
    try {
      await deleteMutation.mutateAsync(deleteModal.listing.id);
      success('Listing deleted successfully');
      setDeleteModal({ open: false, listing: null });
    } catch (error) {
      showError('Failed to delete listing: ' + (error.message || 'Unknown error'));
      setDeleteModal({ open: false, listing: null });
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleMarkAsSold = (id, is_sold) => {
    markAsSoldMutation.mutate(
      { id, is_sold },
      {
        onSuccess: () => success(is_sold ? 'Marked as sold' : 'Relisted'),
        onError: (err) => showError(err.message || 'Failed to update'),
      }
    );
    // Optimistic: immediately move the card
    setActiveTab(is_sold ? 'sold' : 'active');
  };

  const handleBump = (id) => {
    bumpMutation.mutate(id, {
      onSuccess: () => {
        setBumpedIds(prev => new Set(prev).add(id));
        bumpedTimers.current[id] = setTimeout(() => {
          setBumpedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          delete bumpedTimers.current[id];
        }, 3000);
      },
      onError: (err) => showError(err.message || 'Could not bump listing.'),
    });
  };

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = bumpedTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container-app py-6" aria-busy="true" aria-label="Loading your listings">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="skeleton w-40 h-8 rounded" />
            <div className="skeleton w-28 h-10 rounded-xl" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-static p-4">
                <div className="flex gap-4">
                  <div className="skeleton w-24 h-24 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-5 w-3/4 rounded" />
                    <div className="skeleton h-7 w-28 rounded" />
                    <div className="skeleton h-4 w-36 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-4 sm:py-6">
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text">My Listings</h1>
            <p className="text-text-secondary mt-1">
              {myListings.length} listing{myListings.length !== 1 ? 's' : ''} in {currentTab.label}
            </p>
          </div>
          <Link to="/listings/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Post New</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6 overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex-shrink-0 inline-flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:border-border hover:text-text'
                  }`}
                  aria-current={activeTab === tab.key ? 'page' : undefined}
                >
                  {tab.label}
                  {activeTab === tab.key && myListings.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      {myListings.length}
                    </span>
                  )}
                </button>
              ))}
            <Link
              to="/my-listings/analytics"
              className="border-transparent text-text-secondary hover:border-border hover:text-text whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex-shrink-0"
            >
              Analytics
            </Link>
          </nav>
        </div>

        {isError ? (
          <div className="empty-state py-12 animate-fade-in" role="alert">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Failed to load listings</h3>
            <p className="text-text-secondary mb-6">Please try again later</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
          </div>
        ) : myListings.length === 0 ? (
          <div className="empty-state py-16 animate-fade-in">
            <div className={`empty-state-icon ${activeTab === 'pending' ? 'text-green-500 bg-green-50' : ''}`}>
              {activeTab === 'pending' ? (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-text mb-2">
              {activeTab === 'active' && 'No active listings'}
              {activeTab === 'sold' && 'No sold listings yet'}
              {activeTab === 'pending' && 'All clear! No listings waiting for review.'}
            </h3>
            <p className="text-text-secondary mb-6 max-w-sm">
              {activeTab === 'active' && 'Start selling by posting your first listing. It\'s quick and easy!'}
              {activeTab === 'sold' && 'Your sold listings will appear here.'}
              {activeTab === 'pending' && 'Your listings will appear here when they are pending admin approval.'}
            </p>
            {activeTab === 'active' && (
              <Link to="/listings/new" className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post Your First Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myListings.map((listing, index) => (
              <article
                key={listing.id}
                className={`card-static p-4 hover:shadow-md transition-shadow animate-fade-in-up overflow-visible ${overflowMenuListingId === listing.id ? 'relative z-30' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex gap-4">
                  <Link to={`/listings/${listing.id}`} className="shrink-0" aria-label={`View ${listing.title}`}>
                    <div className="w-[72px] h-[72px] rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group">
                      <SafeImage
                        src={listing.image_url}
                        alt=""
                        category={listing.category?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        placeholderClassName="w-full h-full"
                      />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {listing.moderation_status && (
                          <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full inline-flex mb-2 ${
                            listing.moderation_status === 'approved'
                              ? 'bg-primary-50 text-primary-dark border border-primary-100'
                              : listing.moderation_status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {listing.moderation_status}
                          </span>
                        )}
                        {listing.is_sold && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full inline-flex mb-2 ml-2 bg-red-100 text-red-800 border border-red-200 font-bold">
                            Sold
                          </span>
                        )}
                        {listing.category && (
                          <span className="badge-secondary text-xs mb-1.5 ml-1">
                            {listing.category.name}
                          </span>
                        )}
                        <Link to={`/listings/${listing.id}`}>
                          <h3 className="font-bold text-text hover:text-primary transition-colors truncate text-lg">
                            {listing.title}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    <p className="price text-xl font-extrabold mt-1">
                      {formatPrice(listing.price)}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      {listing.view_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {listing.view_count}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <time dateTime={listing.created_at}>{formatRelativeDate(listing.created_at)}</time>
                      </span>
                    </div>

                    {activeTab === 'active' && listing.is_expired && (
                      <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                        </svg>
                        This listing is over 60 days old. Consider reposting.
                      </div>
                    )}

                    <div className="flex gap-2 mt-3 items-center">
                      {activeTab !== 'sold' && (
                        <Link
                          to={`/listings/${listing.id}/edit`}
                          className="btn-secondary !text-xs !px-3 !py-1.5 inline-flex items-center gap-1.5"
                        >
                          <Edit3 size={14} />
                          Edit
                        </Link>
                      )}
                      <button
                        onClick={() => setDeleteModal({ open: true, listing })}
                        className="btn-danger !text-xs !px-3 !py-1.5 inline-flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                      <div className="relative ml-auto">
                        <button
                          onClick={() => setOverflowMenuListingId(overflowMenuListingId === listing.id ? null : listing.id)}
                          className="btn-ghost min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
                          aria-label="More actions"
                          aria-expanded={overflowMenuListingId === listing.id}
                        >
                          <MoreVertical size={20} />
                        </button>
                        {overflowMenuListingId === listing.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOverflowMenuListingId(null)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 animate-fade-in-down">
                              <Link
                                to={`/listings/${listing.id}`}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-gray-50 min-h-[44px]"
                                onClick={() => setOverflowMenuListingId(null)}
                              >
                                <Eye size={16} />
                                View
                              </Link>
                              {activeTab === 'active' && (
                                <button
                                  onClick={() => {
                                    handleMarkAsSold(listing.id, true);
                                    setOverflowMenuListingId(null);
                                  }}
                                  disabled={markAsSoldMutation.isPending}
                                  className="flex items-center gap-3 px-4 py-3 text-sm text-green-700 hover:bg-green-50 w-full text-left min-h-[44px]"
                                >
                                  <CheckCircle2 size={16} />
                                  Mark as Sold
                                </button>
                              )}
                              {activeTab === 'sold' && (
                                <button
                                  onClick={() => {
                                    handleMarkAsSold(listing.id, false);
                                    setOverflowMenuListingId(null);
                                  }}
                                  disabled={markAsSoldMutation.isPending}
                                  className="flex items-center gap-3 px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 w-full text-left min-h-[44px]"
                                >
                                  <RotateCcw size={16} />
                                  Relist
                                </button>
                              )}
                              {activeTab === 'active' && (
                                <button
                                  onClick={() => {
                                    handleBump(listing.id);
                                    setOverflowMenuListingId(null);
                                  }}
                                  disabled={bumpMutation.isPending}
                                  className={`flex items-center gap-3 px-4 py-3 text-sm w-full text-left min-h-[44px] ${
                                    bumpedIds.has(listing.id) ? 'text-green-700 hover:bg-green-50' : 'text-amber-700 hover:bg-amber-50'
                                  }`}
                                >
                                  <ArrowUp size={16} />
                                  {bumpedIds.has(listing.id) ? 'Bumped!' : 'Bump to Top'}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && !isError && myListings.length > 0 && (
          <Pagination pagination={pagination} onPageChange={setPage} />
        )}
      </div>

      <Modal
        isOpen={deleteModal.open && !!deleteModal.listing}
        onClose={() => setDeleteModal({ open: false, listing: null })}
        title="Delete Listing"
        size="sm"
      >
        {deleteModal.listing && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-text-secondary mb-2">Are you sure you want to delete this listing?</p>
              <p className="font-semibold text-text mb-4">&ldquo;{deleteModal.listing.title}&rdquo;</p>
              <p className="text-sm text-error mb-6">This action cannot be undone.</p>
            </div>
            <ModalFooter>
              <button onClick={() => setDeleteModal({ open: false, listing: null })} className="btn-secondary flex-1 sm:flex-none">Cancel</button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="btn-danger flex-1 sm:flex-none">
                {deleteMutation.isPending ? (
                  <><div className="spinner w-4 h-4 border-white border-t-transparent" aria-hidden="true" /><span>Deleting...</span></>
                ) : <span>Delete Listing</span>}
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
}