import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, truncateText, formatRelativeDate } from '../lib/utils';
import { StarRatingCompact } from './StarRating';
import SafeImage from './SafeImage';
import SaveButton from './SaveButton';

// Condition display labels and colors
const CONDITION_CONFIG = {
  new: { label: 'New', badgeClass: 'bg-green-50 text-green-700 border border-green-100' },
  used_like_new: { label: 'Used – Like New', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100' },
  used_good: { label: 'Used – Good', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100' },
  used_fair: { label: 'Used – Fair', badgeClass: 'bg-red-50 text-red-600 border border-red-100' },
};

const ListingCard = React.memo(({ listing, index = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const {
    id,
    title,
    price,
    image_url,
    area,
    category,
    condition,
    created_at,
    rating_avg,
    review_count,
    is_sold,
    images,
    is_expired,
  } = listing;

  const imageUrl = image_url || (images && images.length > 0 ? images[0] : null) ;
  const conditionConfig = condition ? CONDITION_CONFIG[condition] : null;

  // Category color mapping
  const categoryColors = {
    'Electronics & Phones': 'from-blue-500 to-indigo-600',
    'Clothing & Apparel': 'from-pink-500 to-rose-600',
    'Food & Groceries': 'from-primary to-primary-dark',
    'Home & Furniture': 'from-amber-500 to-orange-600',
    Vehicles: 'from-violet-500 to-purple-600',
    Services: 'from-primary-light to-primary',
    Other: 'from-gray-500 to-slate-600',
  };

  const gradientClass = categoryColors[category?.name] || categoryColors.Other;

  return (
    <Link 
      to={`/listings/${id}`} 
      className={`card block relative animate-fade-in-up overflow-hidden ${!is_sold ? 'group hover:-translate-y-1' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Sold badge - top left */}
      {is_sold && (
        <div className="absolute top-2 left-2 z-20">
          <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
            Sold
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#F5EFE8] to-[#E8D5C0] ${is_sold ? 'opacity-75 grayscale' : ''}`}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#F5EFE8] animate-pulse z-0" />
        )}
        <SafeImage
          src={imageUrl}
          alt={title}
          category={category?.name}
          onLoad={() => setImageLoaded(true)}
          className={`relative z-1 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          placeholderClassName="relative z-1 w-full h-full"
          iconClassName="w-10 h-10 text-[#C8622A]/40 mb-2"
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Save button */}
        <SaveButton listingId={id} size="sm" className="absolute top-2 right-2 shadow-sm z-10" />
      </div>

      {/* Content */}
      <div className={`p-4 space-y-1 ${is_sold ? 'opacity-60' : ''}`}>
        {/* Title */}
        <h3 className="font-semibold text-[#1A1A1A] text-sm leading-snug line-clamp-2 group-hover:text-[#C8622A] transition-colors">
          {truncateText(title, 60)}
        </h3>

        {/* Condition badges inline below title */}
        {is_expired && (
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            <span className="inline-block px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200">
              Expired
            </span>
          </div>
        )}
        {conditionConfig && !is_sold && !is_expired && (
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-full ${conditionConfig.badgeClass}`}>
              {conditionConfig.label}
            </span>
            {listing.negotiable && (
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium rounded-full">
                Negotiable
              </span>
            )}
          </div>
        )}

        {/* Price - always visible for accessibility */}
        <div className="mt-2 mb-2">
          <p className="text-sm md:text-lg font-bold text-[#C8622A] flex items-center gap-2">
            {is_sold ? (
              <span className="text-[#9A6B50] line-through text-base font-medium">{formatPrice(price)}</span>
            ) : (
              formatPrice(price)
            )}
          </p>
        </div>

        {/* Rating */}
        <div className="mb-3 min-h-[20px]">
          {review_count > 0 ? (
            <StarRatingCompact rating={rating_avg} reviewCount={review_count} />
          ) : (
            <div className="flex items-center gap-1" aria-label="No reviews yet" title="No reviews yet">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-3 h-3 sm:w-4 sm:h-4 text-[#d1d5db]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-[#6B6B6B] mt-2">
          {/* Region */}
          {area && (
            <span className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-[#C8622A]/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              <span className="font-medium">{area.name}</span>
            </span>
          )}

          {/* Time */}
          {created_at && (
            <span className="hidden sm:flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#C8622A]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatRelativeDate(created_at)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`h-1 bg-gradient-to-r ${gradientClass} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
    </Link>
  );
});

export default ListingCard;
