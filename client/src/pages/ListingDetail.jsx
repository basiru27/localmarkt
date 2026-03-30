import { useParams, Link, useNavigate } from 'react-router-dom';
import { useListing, useDeleteListing } from '../hooks/useListings';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatRelativeDate, getPlaceholderImage } from '../lib/utils';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data: listing, isLoading, isError, error } = useListing(id);
  const deleteMutation = useDeleteListing();

  const isOwner = user && listing && user.id === listing.user_id;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      navigate('/my-listings');
    } catch (err) {
      alert('Failed to delete listing: ' + (err.message || 'Unknown error'));
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-6">
        <div className="max-w-3xl mx-auto">
          {/* Image skeleton */}
          <div className="aspect-video skeleton rounded-xl mb-6" />
          {/* Title skeleton */}
          <div className="skeleton h-8 w-3/4 mb-4" />
          {/* Price skeleton */}
          <div className="skeleton h-10 w-32 mb-6" />
          {/* Details skeleton */}
          <div className="space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-app py-12 text-center">
        <h2 className="text-xl font-semibold text-text mb-2">Listing not found</h2>
        <p className="text-text-secondary mb-4">
          {error?.message || 'This listing may have been removed'}
        </p>
        <Link to="/" className="btn-primary">
          Back to listings
        </Link>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const imageUrl = listing.image_url || getPlaceholderImage(listing.category?.name);

  return (
    <div className="container-app py-4 sm:py-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-text-secondary hover:text-primary mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        {/* Image */}
        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = getPlaceholderImage(listing.category?.name);
            }}
          />
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            {/* Category badge */}
            {listing.category && (
              <span className="badge-primary mb-2">{listing.category.name}</span>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-text">{listing.title}</h1>
            <p className="price text-2xl sm:text-3xl mt-2">{formatPrice(listing.price)}</p>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex gap-2">
              <Link
                to={`/listings/${id}/edit`}
                className="btn-secondary text-sm"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn text-sm bg-error text-white hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="card p-4 sm:p-6 space-y-4">
          {/* Location & Time */}
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            {listing.region && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {listing.region.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Posted {formatRelativeDate(listing.created_at)}
            </span>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="font-semibold text-text mb-2">Description</h2>
              <p className="text-text-secondary whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          {/* Contact - only for authenticated users */}
          <div className="border-t border-border pt-4">
            <h2 className="font-semibold text-text mb-2">Contact Seller</h2>
            {isAuthenticated ? (
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-text font-medium">{listing.contact}</p>
                <p className="text-xs text-text-secondary mt-2">
                  Please be respectful when contacting the seller
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-text-secondary mb-3">
                  Log in to see contact information
                </p>
                <Link to="/login" state={{ from: { pathname: `/listings/${id}` } }} className="btn-primary">
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
