import { Link } from 'react-router-dom';
import { useListings, useDeleteListing } from '../hooks/useListings';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatRelativeDate } from '../lib/utils';

export default function MyListings() {
  const { user } = useAuth();
  const { data: allListings, isLoading, isError } = useListings({});
  const deleteMutation = useDeleteListing();

  // Filter to only user's listings
  const myListings = allListings?.filter((listing) => listing.user_id === user?.id) || [];

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      alert('Failed to delete listing: ' + (error.message || 'Unknown error'));
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-text mb-6">My Listings</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="skeleton w-24 h-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-6 w-24" />
                    <div className="skeleton h-4 w-32" />
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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text">My Listings</h1>
          <Link to="/listings/new" className="btn-primary text-sm">
            Post New
          </Link>
        </div>

        {isError ? (
          <div className="text-center py-12">
            <p className="text-error">Failed to load listings</p>
          </div>
        ) : myListings.length === 0 ? (
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
            <h3 className="text-lg font-medium text-text mb-1">No listings yet</h3>
            <p className="text-text-secondary text-sm mb-4">
              Start selling by posting your first listing
            </p>
            <Link to="/listings/new" className="btn-primary">
              Post a Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myListings.map((listing) => (
              <div key={listing.id} className="card p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <Link to={`/listings/${listing.id}`} className="shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100">
                      {listing.image_url ? (
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/listings/${listing.id}`}>
                      <h3 className="font-semibold text-text hover:text-primary truncate">
                        {listing.title}
                      </h3>
                    </Link>
                    <p className="price text-lg">{formatPrice(listing.price)}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Posted {formatRelativeDate(listing.created_at)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link
                        to={`/listings/${listing.id}/edit`}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={deleteMutation.isPending}
                        className="btn text-xs py-1 px-3 bg-red-50 text-error hover:bg-red-100"
                      >
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
    </div>
  );
}
