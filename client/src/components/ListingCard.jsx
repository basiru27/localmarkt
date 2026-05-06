import { Link } from 'react-router-dom';
import { formatPrice, truncateText, getPlaceholderImage, formatRelativeDate } from '../lib/utils';
import { StarRatingCompact } from './StarRating';

// Condition display labels and colors
const CONDITION_CONFIG = {
  new: { label: 'New', color: 'text-primary-dark' },
  used_like_new: { label: 'Used – Like New', color: 'text-primary' },
  used_good: { label: 'Used – Good', color: 'text-amber-600' },
  used_fair: { label: 'Used – Fair', color: 'text-orange-600' },
};

export default function ListingCard({ listing, index = 0 }) {
  const {
    id,
    title,
    price,
    image_url,
    region,
    category,
    condition,
    created_at,
    rating_avg,
    review_count,
    is_sold,
  } = listing;

  const imageUrl = image_url || getPlaceholderImage(category?.name);
  const conditionConfig = condition ? CONDITION_CONFIG[condition] : null;

  // Category color mapping
  const categoryColors = {
    Electronics: 'from-blue-500 to-indigo-600',
    Clothing: 'from-pink-500 to-rose-600',
    'Food & Produce': 'from-primary to-primary-dark',
    Furniture: 'from-amber-500 to-orange-600',
    Vehicles: 'from-violet-500 to-purple-600',
    Services: 'from-primary-light to-primary',
    Agriculture: 'from-primary-dark to-primary',
    Other: 'from-gray-500 to-slate-600',
  };

  const gradientClass = categoryColors[category?.name] || categoryColors.Other;

  return (
    <Link 
      to={`/listings/${id}`} 
      className={`card group block animate-fade-in-up ${is_sold ? 'opacity-60 grayscale-[30%]' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.src = getPlaceholderImage(category?.name);
          }}
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category badge - top left */}
        {category && (
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${gradientClass} shadow-lg`}>
              {category.name}
            </span>
          </div>
        )}

        {/* Sold badge - top right */}
        {is_sold && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold text-white bg-red-600 shadow-lg uppercase tracking-wider">
              Sold
            </span>
          </div>
        )}

        {/* Price tag - always visible, enhanced on hover */}
        <div className="absolute bottom-3 right-3 transition-all duration-300 transform group-hover:scale-105">
          <span className={`price-tag ${is_sold ? 'bg-gray-800 border-gray-700' : ''}`}>
            {is_sold ? 'Sold' : formatPrice(price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-text text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {truncateText(title, 60)}
        </h3>

        {/* Price - always visible for accessibility */}
        <div className="mb-3">
          <p className="price text-xl font-extrabold flex items-center gap-2">
            {is_sold ? (
              <>
                <span className="text-gray-400 line-through text-base font-medium">{formatPrice(price)}</span>
                <span className="text-red-600">Sold</span>
              </>
            ) : (
              formatPrice(price)
            )}
          </p>
          {listing.negotiable && !is_sold && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded-full border border-green-100">
              Negotiable
            </span>
          )}
        </div>

        {/* Condition */}
        {conditionConfig && (
          <div className="flex items-center gap-1.5 text-xs mb-3">
            <svg className={`w-3.5 h-3.5 ${conditionConfig.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`font-medium ${conditionConfig.color}`}>{conditionConfig.label}</span>
          </div>
        )}

        {/* Rating */}
        <div className="mb-3 min-h-[20px]">
          {review_count > 0 ? (
            <StarRatingCompact rating={rating_avg} reviewCount={review_count} />
          ) : (
            <div className="flex items-center gap-1" aria-label="No reviews yet" title="No reviews yet">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-4 h-4 text-[#d1d5db]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          {/* Region */}
          {region && (
            <span className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-primary"
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
              <span className="font-medium">{region.name}</span>
            </span>
          )}

          {/* Time */}
          {created_at && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
}
