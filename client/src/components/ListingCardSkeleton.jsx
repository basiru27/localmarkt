export default function ListingCardSkeleton() {
  return (
    <div className="card-static overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-[4/3] skeleton skeleton-image relative">
        {/* Category badge skeleton */}
        <div className="absolute top-3 left-3">
          <div className="skeleton w-20 h-6 rounded-lg" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="skeleton skeleton-text w-full mb-2" />
        <div className="skeleton skeleton-text w-3/4 mb-3" />

        {/* Price */}
        <div className="skeleton w-28 h-7 rounded-lg mb-3" />

        {/* Meta info */}
        <div className="flex items-center justify-between">
          <div className="skeleton w-24 h-4 rounded" />
          <div className="skeleton w-16 h-4 rounded" />
        </div>
      </div>

      {/* Bottom accent line skeleton */}
      <div className="h-1 skeleton" />
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}
