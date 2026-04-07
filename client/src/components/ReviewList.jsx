import { useState } from 'react';
import StarRating from './StarRating';
import { SellerAvatar } from './SellerInfo';
import { useDeleteReview } from '../hooks/useReviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal, { ModalFooter } from './Modal';

/**
 * Format date for review display
 */
function formatReviewDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

/**
 * Check if a review was edited
 */
function wasEdited(review) {
  if (!review.updated_at || !review.created_at) return false;
  const created = new Date(review.created_at).getTime();
  const updated = new Date(review.updated_at).getTime();
  // Consider edited if updated more than 1 minute after creation
  return updated - created > 60000;
}

/**
 * Single review item component
 */
function ReviewItem({ review, listingId, onEdit }) {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const deleteMutation = useDeleteReview();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const isOwner = user && review.reviewer_id === user.id;
  const reviewerName = review.reviewer?.display_name || 'Anonymous';
  const isEdited = wasEdited(review);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ reviewId: review.id, listingId });
      success('Review deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showError(err.message || 'Failed to delete review');
    }
  };

  return (
    <>
      <div className="py-4 first:pt-0 last:pb-0">
        <div className="flex gap-3">
          {/* Avatar */}
          <SellerAvatar name={reviewerName} userId={review.reviewer_id} size="md" />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-text">{reviewerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating rating={review.rating} readonly size="sm" />
                  <span className="text-xs text-text-muted">
                    {formatReviewDate(review.created_at)}
                    {isEdited && ' (edited)'}
                  </span>
                </div>
              </div>
              
              {/* Owner actions */}
              {isOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(review)}
                    className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    title="Edit review"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-1.5 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete review"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {/* Comment */}
            {review.comment && (
              <p className="mt-2 text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Review"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-text-secondary mb-6">
            Are you sure you want to delete your review? This action cannot be undone.
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
              <span>Delete Review</span>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}

/**
 * ReviewList component displays all reviews for a listing
 * 
 * @param {Object} props
 * @param {Array} props.reviews - Array of review objects
 * @param {string} props.listingId - ID of the listing
 * @param {boolean} props.isLoading - Loading state
 * @param {function} props.onEditReview - Callback when user wants to edit their review
 */
export default function ReviewList({ reviews, listingId, isLoading, onEditReview }) {
  if (isLoading) {
    return (
      <div className="card-static p-4 sm:p-5">
        <div className="skeleton h-6 w-32 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-4 flex gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="card-static p-4 sm:p-5">
        <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Reviews
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-text-secondary">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-static p-4 sm:p-5">
      <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Reviews ({reviews.length})
      </h3>
      
      <div className="divide-y divide-border">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            listingId={listingId}
            onEdit={onEditReview}
          />
        ))}
      </div>
    </div>
  );
}
