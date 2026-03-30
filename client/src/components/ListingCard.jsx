import { Link } from 'react-router-dom';
import { formatPrice, truncateText, getPlaceholderImage } from '../lib/utils';

export default function ListingCard({ listing }) {
  const {
    id,
    title,
    price,
    image_url,
    region,
    category,
  } = listing;

  const imageUrl = image_url || getPlaceholderImage(category?.name);

  return (
    <Link to={`/listings/${id}`} className="card group hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.src = getPlaceholderImage(category?.name);
          }}
        />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Category badge */}
        {category && (
          <span className="badge-secondary text-xs mb-2">
            {category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="font-semibold text-text text-sm sm:text-base line-clamp-2 mb-1">
          {truncateText(title, 50)}
        </h3>

        {/* Price */}
        <p className="price text-lg sm:text-xl">
          {formatPrice(price)}
        </p>

        {/* Region */}
        {region && (
          <p className="text-text-secondary text-xs sm:text-sm mt-2 flex items-center gap-1">
            <svg
              className="w-3 h-3"
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
            {region.name}
          </p>
        )}
      </div>
    </Link>
  );
}
