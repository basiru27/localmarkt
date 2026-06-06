import { Calendar, CheckCircle2, MessageSquare, Package, Star } from 'lucide-react';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useSellerProfile, useSellerListings, useSellerReviews } from '../hooks/useSellers';
import ListingCard from '../components/ListingCard';
import SafeImage from '../components/SafeImage';
import Pagination from '../components/ui/Pagination';
import StarRating from '../components/StarRating';
import { ListingGridSkeleton } from '../components/ListingCardSkeleton';
import { normalizePhoneForWhatsApp } from '../lib/utils';

function ReviewCard({ review }) {
  const rating = review.rating || 0;
  const reviewerName = review.reviewer?.display_name || 'Anonymous';
  const reviewerAvatar = review.reviewer?.avatar_url;
  const listingTitle = review.listing?.title || 'Listing';
  const dateStr = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden shrink-0">
          {reviewerAvatar ? (
            <SafeImage src={reviewerAvatar} alt={reviewerName} className="w-full h-full object-cover" placeholderClassName="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
              {reviewerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{reviewerName}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 truncate">{listingTitle}</span>
          </div>
          <div className="mt-1">
            <StarRating rating={rating} readonly size="sm" />
          </div>
          {review.comment && (
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{review.comment}</p>
          )}
          {dateStr && (
            <p className="text-xs text-gray-400 mt-1.5">{dateStr}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light mb-8 flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-gray-200 w-1/3 rounded" />
            <div className="h-4 bg-gray-200 w-1/4 rounded" />
            <div className="h-10 bg-gray-200 w-2/3 rounded mt-2" />
          </div>
        </div>
        <ListingGridSkeleton count={8} />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-app py-12 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Seller not found</h2>
      <p className="text-gray-500">This seller profile may not exist or has been removed.</p>
    </div>
  );
}

export default function SellerProfile() {
  const { id } = useParams();
  const [listingsPage, setListingsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);

  const { data: seller, isLoading, isError } = useSellerProfile(id);
  const { data: listingsData } = useSellerListings(id, listingsPage);
  const { data: reviewsData } = useSellerReviews(id, reviewsPage);

  useDocumentTitle(seller?.display_name ? `${seller.display_name}'s Profile` : 'Seller Profile');

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !seller) return <NotFound />;

  const whatsappNumber = seller.phone_number ? normalizePhoneForWhatsApp(seller.phone_number) : null;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;

  const listingsPagination = listingsData ? {
    page: listingsData.page,
    total: listingsData.total,
    limit: 12,
    totalPages: listingsData.pages,
    hasNextPage: listingsData.page < listingsData.pages,
    hasPrevPage: listingsData.page > 1,
  } : null;

  const reviewsPagination = reviewsData ? {
    page: reviewsData.page,
    total: reviewsData.total,
    limit: 10,
    totalPages: reviewsData.pages,
    hasNextPage: reviewsData.page < reviewsData.pages,
    hasPrevPage: reviewsData.page > 1,
  } : null;

  return (
    <div className="container-app py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 shrink-0">
              {seller.avatar_url ? (
                <SafeImage src={seller.avatar_url} alt={seller.display_name} className="w-full h-full object-cover" placeholderClassName="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500 bg-gray-100">
                  {(seller.display_name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{seller.display_name}</h1>
                {seller.verified_seller && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Member since {new Date(seller.member_since).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shrink-0 shadow-sm w-full sm:w-auto justify-center"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Star className="w-5 h-5 text-[#C8622A] mb-1" />
              <span className="text-xl font-bold text-gray-900">{seller.avg_rating > 0 ? seller.avg_rating : '—'}</span>
              <span className="text-xs text-gray-500 font-medium">Avg Rating</span>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Package className="w-5 h-5 text-[#C8622A] mb-1" />
              <span className="text-xl font-bold text-gray-900">{seller.active_listings}</span>
              <span className="text-xs text-gray-500 font-medium">Total Listings</span>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-5 h-5 text-[#C8622A] mb-1" />
              <span className="text-xl font-bold text-gray-900">{seller.total_reviews}</span>
              <span className="text-xs text-gray-500 font-medium">Total Reviews</span>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Listings
            {listingsData?.total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({listingsData.total})</span>
            )}
          </h2>

          {listingsData?.listings?.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listingsData.listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {listingsData.pages > 1 && (
                <Pagination pagination={listingsPagination} onPageChange={setListingsPage} />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No active listings.</p>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reviews
            {reviewsData?.total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({reviewsData.total})</span>
            )}
          </h2>

          {reviewsData?.reviews?.length > 0 ? (
            <>
              <div className="space-y-4">
                {reviewsData.reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              {reviewsData.pages > 1 && (
                <Pagination pagination={reviewsPagination} onPageChange={setReviewsPage} />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
