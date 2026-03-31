import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useListing, useDeleteListing } from '../hooks/useListings';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatRelativeDate, getPlaceholderImage, looksLikePhoneNumber, getWhatsAppLink } from '../lib/utils';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const { data: listing, isLoading, isError, error } = useListing(id);
  const deleteMutation = useDeleteListing();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isOwner = user && listing && user.id === listing.user_id;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      success('Listing deleted successfully');
      navigate('/my-listings');
    } catch (err) {
      showError('Failed to delete listing: ' + (err.message || 'Unknown error'));
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-6">
        <div className="max-w-4xl mx-auto">
          {/* Back button skeleton */}
          <div className="skeleton w-32 h-6 rounded mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Image skeleton */}
            <div className="lg:col-span-3">
              <div className="aspect-square skeleton skeleton-image rounded-2xl" />
            </div>
            
            {/* Details skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <div className="skeleton w-24 h-6 rounded-full" />
              <div className="skeleton h-8 w-full" />
              <div className="skeleton h-8 w-2/3" />
              <div className="skeleton h-12 w-40 rounded-lg" />
              <div className="skeleton h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-app py-12">
        <div className="empty-state animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Listing not found</h2>
          <p className="text-text-secondary mb-6 max-w-sm">
            {error?.message || 'This listing may have been removed or is no longer available.'}
          </p>
          <Link to="/" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const imageUrl = listing.image_url || getPlaceholderImage(listing.category?.name);

  // Category color mapping
  const categoryColors = {
    Electronics: 'from-blue-500 to-indigo-600',
    Clothing: 'from-pink-500 to-rose-600',
    'Food & Produce': 'from-green-500 to-emerald-600',
    Furniture: 'from-amber-500 to-orange-600',
    Vehicles: 'from-violet-500 to-purple-600',
    Services: 'from-cyan-500 to-teal-600',
    Agriculture: 'from-lime-500 to-green-600',
    Other: 'from-gray-500 to-slate-600',
  };

  const gradientClass = categoryColors[listing.category?.name] || categoryColors.Other;

  return (
    <div className="container-app py-4 sm:py-6">
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary mb-6 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Image Section */}
          <div className="lg:col-span-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg">
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton" />
              )}
              <img
                src={imageUrl}
                alt={listing.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.target.src = getPlaceholderImage(listing.category?.name);
                  setImageLoaded(true);
                }}
              />
              
              {/* Category badge overlay */}
              {listing.category && (
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${gradientClass} shadow-lg`}>
                    {listing.category.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight mb-4">
                {listing.title}
              </h1>
              <div className="price-tag text-xl inline-flex">
                {formatPrice(listing.price)}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3">
              {listing.region && (
                <span className="badge-secondary">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.region.name}
                </span>
              )}
              <span className="badge-secondary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatRelativeDate(listing.created_at)}
              </span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="card-static p-4 sm:p-5">
                <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h2>
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Contact Section */}
            <div className="card-static p-4 sm:p-5">
              <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Seller
              </h2>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-primary-50 to-teal-50 rounded-xl p-4 border border-primary/10">
                    <p className="text-text font-semibold text-lg">{listing.contact}</p>
                  </div>
                  
                  {/* WhatsApp button */}
                  {listing.contact && looksLikePhoneNumber(listing.contact) && (
                    <a
                      href={getWhatsAppLink(listing.contact, listing.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp w-full"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat on WhatsApp
                    </a>
                  )}
                  
                  <p className="text-xs text-text-muted text-center">
                    Please be respectful when contacting the seller
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-text-secondary mb-4">
                    Log in to see contact information
                  </p>
                  <Link 
                    to="/login" 
                    state={{ from: { pathname: `/listings/${id}` } }} 
                    className="btn-primary w-full"
                  >
                    Log in to Contact
                  </Link>
                </div>
              )}
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="card-static p-4 sm:p-5 border-2 border-dashed border-border">
                <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage Listing
                </h2>
                <div className="flex gap-3">
                  <Link
                    to={`/listings/${id}/edit`}
                    className="btn-secondary flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
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
                Are you sure you want to delete "{listing.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
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
