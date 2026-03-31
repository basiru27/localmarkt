import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useListings, useDeleteListing } from '../hooks/useListings';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatRelativeDate, getPlaceholderImage } from '../lib/utils';

export default function MyListings() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const { data: allListings, isLoading, isError } = useListings({});
  const deleteMutation = useDeleteListing();
  const [deleteModal, setDeleteModal] = useState({ open: false, listing: null });

  // Filter to only user's listings
  const myListings = allListings?.filter((listing) => listing.user_id === user?.id) || [];

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

  if (isLoading) {
    return (
      <div className="container-app py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="skeleton w-40 h-8 rounded" />
            <div className="skeleton w-28 h-10 rounded-xl" />
          </div>
          
          {/* List skeleton */}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text">My Listings</h1>
            <p className="text-text-secondary mt-1">
              {myListings.length} listing{myListings.length !== 1 ? 's' : ''} posted
            </p>
          </div>
          <Link to="/listings/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Post New</span>
          </Link>
        </div>

        {isError ? (
          <div className="empty-state py-12 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Failed to load listings</h3>
            <p className="text-text-secondary mb-6">Please try again later</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : myListings.length === 0 ? (
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
            <h3 className="text-xl font-bold text-text mb-2">No listings yet</h3>
            <p className="text-text-secondary mb-6 max-w-sm">
              Start selling by posting your first listing. It's quick and easy!
            </p>
            <Link to="/listings/new" className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post Your First Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myListings.map((listing, index) => (
              <div 
                key={listing.id} 
                className="card-static p-4 hover:shadow-md transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <Link to={`/listings/${listing.id}`} className="shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group">
                      <img
                        src={listing.image_url || getPlaceholderImage(listing.category?.name)}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = getPlaceholderImage(listing.category?.name);
                        }}
                      />
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {listing.category && (
                          <span className="badge-secondary text-xs mb-1.5">
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
                      {listing.region && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {listing.region.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatRelativeDate(listing.created_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link
                        to={`/listings/${listing.id}`}
                        className="btn-ghost text-xs py-1.5 px-3"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                      <Link
                        to={`/listings/${listing.id}/edit`}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ open: true, listing })}
                        className="btn-ghost text-xs py-1.5 px-3 text-error hover:bg-red-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.listing && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, listing: null })}>
          <div 
            className="modal-content w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Delete Listing?</h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete "{deleteModal.listing.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, listing: null })}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="btn-danger flex-1"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="spinner w-4 h-4 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
