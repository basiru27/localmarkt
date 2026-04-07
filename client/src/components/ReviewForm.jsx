import { useState } from 'react';
import StarRating from './StarRating';
import { useCreateReview, useUpdateReview } from '../hooks/useReviews';
import { useToast } from '../context/ToastContext';

/**
 * ReviewForm component for creating or editing reviews
 * 
 * @param {Object} props
 * @param {string} props.listingId - ID of the listing being reviewed
 * @param {Object} props.existingReview - Existing review data (for edit mode)
 * @param {function} props.onCancel - Callback to cancel editing
 */
export default function ReviewForm({ listingId, existingReview, onCancel }) {
  // Use existingReview values directly as initial state
  // Parent component should use key={existingReview?.id} to reset form when review changes
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [error, setError] = useState('');
  
  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();
  const { success, error: showError } = useToast();
  
  const isEditing = !!existingReview;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          reviewId: existingReview.id,
          listingId,
          data: { rating, comment: comment.trim() || null },
        });
        success('Review updated successfully');
        if (onCancel) onCancel();
      } else {
        await createMutation.mutateAsync({
          listingId,
          data: { rating, comment: comment.trim() || null },
        });
        success('Review submitted successfully');
        setRating(0);
        setComment('');
      }
    } catch (err) {
      const message = err.message || 'Failed to submit review';
      setError(message);
      showError(message);
    }
  };

  const handleCancel = () => {
    setRating(existingReview?.rating || 0);
    setComment(existingReview?.comment || '');
    setError('');
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="card-static p-4 sm:p-5">
      <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        {isEditing ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* Rating selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Your Rating <span className="text-error">*</span>
        </label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          size="lg"
        />
        {rating > 0 && (
          <p className="text-sm text-text-secondary mt-1">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      {/* Comment textarea */}
      <div className="mb-4">
        <label htmlFor="review-comment" className="block text-sm font-medium text-text-secondary mb-2">
          Your Review (optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this listing..."
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
        />
        <p className="text-xs text-text-muted mt-1 text-right">
          {comment.length}/2000
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isEditing && (
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="btn-primary flex-1"
        >
          {isSubmitting ? (
            <>
              <div className="spinner w-4 h-4 border-white border-t-transparent" aria-hidden="true" />
              <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
            </>
          ) : (
            <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
