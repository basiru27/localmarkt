import { useState } from 'react';

/**
 * StarRating component for displaying and inputting star ratings
 * 
 * @param {Object} props
 * @param {number} props.rating - Current rating value (1-5)
 * @param {function} props.onRatingChange - Callback when rating changes (only in interactive mode)
 * @param {boolean} props.readonly - If true, stars are not clickable
 * @param {string} props.size - Size of stars: 'sm', 'md', 'lg'
 * @param {boolean} props.showValue - If true, show numeric value next to stars
 */
export default function StarRating({ 
  rating = 0, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showValue = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textSizeClasses[size] || textSizeClasses.md;

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="inline-flex items-center gap-1">
      <div 
        className={`inline-flex ${!readonly ? 'cursor-pointer' : ''}`}
        onMouseLeave={handleMouseLeave}
        role={readonly ? 'img' : 'group'}
        aria-label={`Rating: ${rating} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isPartial = !isFilled && star <= displayRating + 0.5 && star > displayRating;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              disabled={readonly}
              className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded disabled:cursor-default`}
              aria-label={readonly ? undefined : `Rate ${star} star${star !== 1 ? 's' : ''}`}
              tabIndex={readonly ? -1 : 0}
            >
              <svg
                className={`${starSize} ${isFilled ? 'text-amber-400' : isPartial ? 'text-amber-400' : 'text-gray-300'} transition-colors`}
                fill={isFilled || isPartial ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isPartial ? (
                  // Half star using gradient
                  <>
                    <defs>
                      <linearGradient id={`half-star-${star}`}>
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path
                      fill={`url(#half-star-${star})`}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </>
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={isFilled ? 0 : 1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                )}
              </svg>
            </button>
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className={`${textSize} font-semibold text-text ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/**
 * Compact star rating display for listing cards
 */
export function StarRatingCompact({ rating, reviewCount, size = 'sm' }) {
  if (!rating || reviewCount === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-1 ${textSizeClasses[size]}`}>
      <svg
        className={`${sizeClasses[size]} text-amber-400`}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span className="font-semibold text-text">{rating.toFixed(1)}</span>
      <span className="text-text-secondary">({reviewCount})</span>
    </div>
  );
}
