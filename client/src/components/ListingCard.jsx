import { Link } from 'react-router-dom';
import { formatPrice, truncateText, getPlaceholderImage, formatRelativeDate } from '../lib/utils';

export default function ListingCard({ listing, index = 0 }) {
  const {
    id,
    title,
    price,
    image_url,
    region,
    category,
    created_at,
  } = listing;

  const imageUrl = image_url || getPlaceholderImage(category?.name);

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

  const gradientClass = categoryColors[category?.name] || categoryColors.Other;

  return (
    <Link 
      to={`/listings/${id}`} 
      className="card group block animate-fade-in-up"
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

        {/* Price tag - bottom right */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <span className="price-tag">
            {formatPrice(price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-text text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {truncateText(title, 60)}
        </h3>

        {/* Price - visible on mobile, hidden on hover for desktop */}
        <p className="price text-xl font-extrabold mb-3 group-hover:hidden sm:group-hover:block">
          {formatPrice(price)}
        </p>

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
