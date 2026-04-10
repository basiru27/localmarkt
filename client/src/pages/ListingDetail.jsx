import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useListing, useDeleteListing } from '../hooks/useListings';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCreateReport } from '../hooks/useReports';
import { formatPrice, formatRelativeDate, getPlaceholderImage, looksLikePhoneNumber, getWhatsAppLink } from '../lib/utils';
import Modal, { ModalFooter } from '../components/Modal';
import StarRating from '../components/StarRating';
import SellerInfo from '../components/SellerInfo';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';

// Condition display configuration
const CONDITION_CONFIG = {
  new: { label: 'New', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  used_like_new: { label: 'Used – Like New', bgColor: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200' },
  used_good: { label: 'Used – Good', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  used_fair: { label: 'Used – Fair', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const { data: listing, isLoading, isError, error } = useListing(id);
  const { data: reviews, isLoading: reviewsLoading } = useReviews(id);
  const deleteMutation = useDeleteListing();
  const createReportMutation = useCreateReport();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const isOwner = user && listing && user.id === listing.user_id;
  
  // Check if current user has already reviewed this listing
  const userReview = reviews?.find(r => r.reviewer_id === user?.id);
  
  // Can review: logged in, not the owner, hasn't already reviewed (unless editing)
  const canReview = isAuthenticated && !isOwner && !userReview;

  const handleEditReview = (review) => {
    setEditingReview(review);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
  };

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

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      showError('Please enter a reason before submitting a report.');
      return;
    }

    try {
      await createReportMutation.mutateAsync({
        listing_id: id,
        reason: reportReason.trim(),
        details: reportDetails.trim() || null,
      });

      success('Report submitted. Thank you for helping keep the marketplace safe.');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      showError(err.message || 'Failed to submit report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-6" aria-busy="true" aria-label="Loading listing details">
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
        <div className="empty-state animate-fade-in" role="alert">
          <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Listing not found</h2>
          <p className="text-text-secondary mb-6 max-w-sm">
            {error?.message || 'This listing may have been removed or is no longer available.'}
          </p>
          <Link to="/" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Image Section */}
          <div className="lg:col-span-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg">
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton" aria-hidden="true" />
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
              <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight mb-2">
                {listing.title}
              </h1>
              
              {/* Rating summary */}
              {listing.review_count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={listing.rating_avg} readonly size="sm" />
                  <span className="text-sm font-semibold text-text">{listing.rating_avg?.toFixed(1)}</span>
                  <span className="text-sm text-text-secondary">({listing.review_count} review{listing.review_count !== 1 ? 's' : ''})</span>
                </div>
              )}
              
              <div className="price-tag text-xl inline-flex">
                {formatPrice(listing.price)}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3">
              {listing.condition && CONDITION_CONFIG[listing.condition] && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${CONDITION_CONFIG[listing.condition].bgColor} ${CONDITION_CONFIG[listing.condition].textColor} ${CONDITION_CONFIG[listing.condition].borderColor}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {CONDITION_CONFIG[listing.condition].label}
                </span>
              )}
              {listing.region && (
                <span className="badge-secondary">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.region.name}
                </span>
              )}
              <span className="badge-secondary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatRelativeDate(listing.created_at)}
              </span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="card-static p-4 sm:p-5">
                <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h2>
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Contact Section - hidden for listing owner */}
            {!isOwner && (
              <div className="card-static p-4 sm:p-5">
                <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                      <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            )}

            {/* Seller Info Section - hidden for listing owner and non-logged-in users */}
            {!isOwner && isAuthenticated && (
              <SellerInfo seller={listing.seller} sellerId={listing.user_id} />
            )}

            {/* Owner actions */}
            {isOwner && (
              <div className="card-static p-4 sm:p-5 border-2 border-dashed border-border">
                <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Report listing */}
            {isAuthenticated && !isOwner && (
              <div className="card-static p-4 sm:p-5">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="btn-ghost w-full justify-center text-error hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Report this listing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 space-y-6">
          {/* Review Form - Show for logged in non-owners who haven't reviewed yet, or when editing */}
          {(canReview || editingReview) && (
            <ReviewForm
              key={editingReview?.id || 'new'}
              listingId={id}
              existingReview={editingReview}
              onCancel={editingReview ? handleCancelEdit : undefined}
            />
          )}
          
          {/* If user already has a review but isn't editing, show prompt */}
          {userReview && !editingReview && (
            <div className="card-static p-4 sm:p-5 bg-primary/5 border-primary/10">
              <p className="text-sm text-text-secondary">
                You have already reviewed this listing. 
                <button
                  onClick={() => handleEditReview(userReview)}
                  className="ml-1 text-primary font-medium hover:underline"
                >
                  Edit your review
                </button>
              </p>
            </div>
          )}
          
          {/* Login prompt for non-authenticated users (only if not owner) */}
          {!isAuthenticated && !isOwner && (
            <div className="card-static p-4 sm:p-5 text-center">
              <p className="text-text-secondary mb-3">
                Want to leave a review?
              </p>
              <Link
                to="/login"
                state={{ from: { pathname: `/listings/${id}` } }}
                className="btn-primary inline-flex"
              >
                Log in to review
              </Link>
            </div>
          )}
          
          {/* Reviews List */}
          <ReviewList
            reviews={reviews}
            listingId={id}
            isLoading={reviewsLoading}
            onEditReview={handleEditReview}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Listing"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-text-secondary mb-2">
            Are you sure you want to delete this listing?
          </p>
          <p className="font-semibold text-text mb-4">
            &quot;{listing.title}&quot;
          </p>
          <p className="text-sm text-error mb-6">
            This action cannot be undone.
          </p>
        </div>
        <ModalFooter>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="btn-secondary flex-1 sm:flex-none"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="btn-danger flex-1 sm:flex-none"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="spinner w-4 h-4 border-white border-t-transparent" aria-hidden="true" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Listing</span>
            )}
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Listing"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Report listings that are fraudulent, abusive, or violate marketplace rules.
          </p>

          <div className="form-group">
            <label htmlFor="report-reason" className="label">Reason</label>
            <input
              id="report-reason"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="input"
              maxLength={120}
              placeholder="Example: Suspected scam / misleading details"
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-details" className="label">Details (optional)</label>
            <textarea
              id="report-details"
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              className="input"
              maxLength={2000}
              rows={4}
              placeholder="Add context to help moderators review faster"
            />
          </div>
        </div>

        <ModalFooter>
          <button onClick={() => setShowReportModal(false)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmitReport}
            disabled={createReportMutation.isPending}
            className="btn-danger"
          >
            Submit Report
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
