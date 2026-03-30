export default function ListingCardSkeleton() {
  return (
    <div className="card">
      {/* Image skeleton */}
      <div className="aspect-[4/3] skeleton" />

      {/* Content skeleton */}
      <div className="p-3 sm:p-4">
        {/* Category badge */}
        <div className="skeleton w-16 h-5 mb-2 rounded-full" />

        {/* Title */}
        <div className="skeleton w-full h-5 mb-1" />
        <div className="skeleton w-2/3 h-5 mb-2" />

        {/* Price */}
        <div className="skeleton w-24 h-7 mb-2" />

        {/* Region */}
        <div className="skeleton w-20 h-4" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}
