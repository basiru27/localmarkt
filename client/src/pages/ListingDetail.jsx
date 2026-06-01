import { useState, useEffect } from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useListing, useListings, useDeleteListing, useMarkAsSold, listingKeys } from '../hooks/useListings';
import { useReviews, useCanReview } from '../hooks/useReviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCreateReport } from '../hooks/useReports';
import { useSavedIds, useToggleSave } from '../hooks/useSaved';
import { useShareListing } from '../hooks/useShare';
import { formatPrice, formatRelativeDate, looksLikePhoneNumber, getWhatsAppLink } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Modal, { ModalFooter } from '../components/Modal';
import StarRating from '../components/StarRating';
import SellerInfo from '../components/SellerInfo';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import ListingCard from '../components/ListingCard';
import ImageLightbox from '../components/ui/ImageLightbox';

import SafeImage from '../components/SafeImage';

// Condition display configuration
const CONDITION_CONFIG = {
  new: { label: 'New', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  used_like_new: { label: 'Used – Like New', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  used_good: { label: 'Used – Good', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  used_fair: { label: 'Used – Fair', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const { data: listing, isLoading, isError, error } = useListing(id);
  useDocumentTitle(listing?.title || 'Listing Details');
  const { data: reviews, isLoading: reviewsLoading } = useReviews(id);

  // Fetch more from seller
  const { data: sellerListingsData } = useListings({
    user_id: listing?.user_id || 'none',
    limit: 4,
    sort: 'newest'
  });

  // Fetch similar items
  const { data: similarListingsData } = useListings({
    category: listing?.category?.id || 'none',
    limit: 4,
    sort: 'newest'
  });

  const sellerListings = sellerListingsData?.data
    ?.filter(item => String(item.id) !== String(id))
    ?.slice(0, 3) || [];

  const similarListings = similarListingsData?.data
    ?.filter(item => String(item.id) !== String(id) && item.user_id !== listing?.user_id)
    ?.slice(0, 3) || [];

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`listing-detail-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        (payload) => {
          const record = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (record && String(record.id) === String(id)) {
            queryClient.invalidateQueries({ queryKey: listingKeys.detail(id), exact: false });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  useEffect(() => {
    if (!listing?.seller?.id && !listing?.user_id) return;
    const sellerId = listing?.seller?.id || listing?.user_id;

    const profileChannel = supabase
      .channel(`profile-detail-${sellerId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new && String(payload.new.id) === String(sellerId)) {
            queryClient.invalidateQueries({ queryKey: listingKeys.detail(id), exact: false });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [listing?.seller?.id, listing?.user_id, id, queryClient]);

  const deleteMutation = useDeleteListing();
  const createReportMutation = useCreateReport();
  const markAsSoldMutation = useMarkAsSold();
  const { data: savedIds = [] } = useSavedIds();
  const { mutate: toggleSave, isPending: savePending } = useToggleSave();
  const { share } = useShareListing();
  const isSaved = savedIds.includes(id);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const isOwner = user && listing && user.id === listing.user_id;
  
  // Analytics: Track listing views
  useEffect(() => {
    if (authLoading || !listing || isOwner) return;

    // Use sessionStorage for a session-level flag to prevent repeat counts
    const viewedKey = `viewed_listing_${id}`;
    if (sessionStorage.getItem(viewedKey)) return;

    // 2-second debounce before recording a view
    const timer = setTimeout(() => {
      supabase.rpc('record_listing_event', {
        p_listing_id: id,
        p_event: 'view',
        p_user_id: user?.id || null
      })
      .then(({ error }) => {
        if (!error) sessionStorage.setItem(viewedKey, 'true');
        else console.error('Failed to record view:', error);
      })
      .catch(err => console.error('Failed to record view:', err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [id, listing, isOwner, user?.id, authLoading]);

  // Analytics: Track contact clicks
  const handleContactClick = async () => {
    if (isOwner) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      // Use fetch with keepalive so the request isn't cancelled when navigating to WhatsApp/email
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/record_listing_event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          p_listing_id: id,
          p_event: 'contact_click',
          p_user_id: user?.id || null
        }),
        keepalive: true
      });
      queryClient.invalidateQueries({ queryKey: ['can-review', id] });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Contact event log failed:', err);
    }
  };
  
  // Check if current user has already reviewed this listing
  const userReview = reviews?.find(r => r.reviewer_id === user?.id);
  
  // Backend review gate: must have contacted seller first
  const { data: reviewGate } = useCanReview(listing?.id);
  
  // Can review: logged in, not the owner, hasn't already reviewed (unless editing), backend gate passed
  const canReview = isAuthenticated && !isOwner && !userReview && reviewGate?.can_review;

  const handleEditReview = (review) => {
    setEditingReview(review);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      success('Listing deleted successfully');
      navigate('/my-listings');
    } catch (err) {
      showError('Failed to delete listing: ' + (err.message || 'Unknown error'));
      setShowDeleteModal(false);
    }
  };

  const handleShare = async () => {
    const result = await share({
      title: listing.title,
      price: listing.price,
      location: listing.area?.name || '',
      url: window.location.href,
    });

    if (result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      showError('Please enter a reason before submitting a report.');
      return;
    }

    try {
      await createReportMutation.mutateAsync({
        listing_id: id,
        reason: reportReason.trim(),
        details: reportDetails.trim() || null,
      });

      success('Report submitted. Thank you for helping keep the marketplace safe.');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      showError(err.message || 'Failed to submit report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-6" aria-busy="true" aria-label="Loading listing details">
        <div className="max-w-4xl mx-auto">
          {/* Back button skeleton */}
          <div className="skeleton w-32 h-6 rounded mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Image skeleton */}
            <div className="lg:col-span-3">
              <div className="aspect-square skeleton skeleton-image rounded-2xl" />
            </div>
            
            {/* Details skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <div className="skeleton w-24 h-6 rounded-full" />
              <div className="skeleton h-8 w-full" />
              <div className="skeleton h-8 w-2/3" />
              <div className="skeleton h-12 w-40 rounded-lg" />
              <div className="skeleton h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-app py-12">
        <div className="empty-state animate-fade-in" role="alert">
          <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Listing not found</h2>
          <p className="text-text-secondary mb-6 max-w-sm">
            {error?.message || 'This listing may have been removed or is no longer available.'}
          </p>
          <Link to="/" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const allImages = Array.isArray(listing.images) && listing.images.length > 0 
    ? listing.images 
    : (listing.image_url ? [listing.image_url] : []);
  
  const currentImageUrl = allImages.length > 0 
    ? allImages[activeImageIndex] || allImages[0] 
    : null;

  return (
    <div className="container-app py-4 sm:py-6">
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-gray-500 mb-4 flex items-center space-x-2">
          <Link to="/" className="hover:text-primary transition-colors">Browse</Link>
          <span>/</span>
          {listing.category?.name && (
            <>
              <Link to={`/?category=${listing.category.id}`} className="hover:text-primary transition-colors">
                {listing.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="truncate max-w-[200px] sm:max-w-xs">
            {listing.title.length > 40 ? listing.title.substring(0, 40) + '...' : listing.title}
          </span>
        </nav>

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary mb-6 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        {listing.is_sold && (
          <div className="mb-6 p-4 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 text-gray-700 font-semibold shadow-sm">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            This item has been sold
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Image Section */}
          <div className="lg:col-span-3">
            <button 
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5EFE8] to-[#E8D5C0] shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => setShowLightbox(true)}
              aria-label="Open image gallery"
            >
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton" aria-hidden="true" />
              )}
              <SafeImage
                key={currentImageUrl}
                src={currentImageUrl}
                alt={listing.title}
                category={listing.category?.name}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                placeholderClassName="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                iconClassName="w-16 h-16 text-[#C8622A]/50"
              />
              
              {/* Category badge overlay */}
              {listing.category && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3E8] text-[#C8622A] font-semibold rounded-lg shadow-sm">
                    {listing.category.name}
                  </span>
                </div>
              )}

              {/* Sold badge overlay */}
              {listing.is_sold && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-extrabold text-white bg-[#1A1A1A] shadow-lg uppercase tracking-wider">
                    Sold
                  </span>
                </div>
              )}
            </button>

            {/* Thumbnail Row */}
            {allImages.length > 1 && (
              <div className="flex flex-row gap-3 mt-4 overflow-x-auto pb-2 snap-x">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setImageLoaded(false);
                      setActiveImageIndex(idx);
                    }}
                    className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden snap-center transition-all ${activeImageIndex === idx ? 'ring-2 ring-primary ring-offset-2 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <SafeImage
                      src={img}
                      alt={`${listing.title} thumbnail ${idx + 1}`}
                      category={listing.category?.name}
                      className="w-full h-full object-cover"
                      placeholderClassName="w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A] leading-tight mb-2">
                {listing.title}
              </h1>
              
              {/* Rating summary */}
              {listing.review_count > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={listing.rating_avg} readonly size="sm" />
                  <span className="text-sm font-semibold text-[#1A1A1A]">{listing.rating_avg?.toFixed(1)}</span>
                  <span className="text-sm text-[#6B6B6B]">({listing.review_count} review{listing.review_count !== 1 ? 's' : ''})</span>
                </div>
              )}
              
              <div className="text-3xl font-bold text-[#C8622A] inline-flex items-center gap-2">
                {listing.is_sold ? (
                  <>
                    <span className="text-gray-300 line-through text-2xl">{formatPrice(listing.price)}</span>
                    <span className="text-[#1A1A1A] font-bold">Sold</span>
                  </>
                ) : (
                  <>
                    {formatPrice(listing.price)}
                    {listing.negotiable && (
                      <span className="ml-2 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                        Negotiable
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3">
              {listing.condition && CONDITION_CONFIG[listing.condition] && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${CONDITION_CONFIG[listing.condition].bgColor} ${CONDITION_CONFIG[listing.condition].textColor} ${CONDITION_CONFIG[listing.condition].borderColor}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {CONDITION_CONFIG[listing.condition].label}
                </span>
              )}
              {listing.area && (
                <span className="badge-secondary">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.area.name}{listing.area.zone ? `, ${listing.area.zone.name}` : ''}
                </span>
              )}
              <span className="badge-secondary">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatRelativeDate(listing.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
                <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{listing.view_count || 0} views</span>
              </span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white border border-[#F0EDE8] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-4 sm:p-5">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#C8622A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h2>
                <p className="text-[#6B6B6B] whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            
            {/* Action CTA Block */}
            <div className="bg-white border border-[#F0EDE8] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-4 sm:p-5 space-y-4 sticky bottom-0 z-40 md:relative md:shadow-none shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:bottom-auto">
              {isOwner ? (
                <>
                  <button
                    onClick={() => markAsSoldMutation.mutate({ id, is_sold: !listing.is_sold })}
                    disabled={markAsSoldMutation.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none focus:ring-primary bg-[#1A1A1A] hover:bg-black text-white"
                  >
                    {markAsSoldMutation.isPending ? (
                      <div className="spinner w-5 h-5 border-white border-t-transparent" aria-hidden="true" />
                    ) : (
                      listing.is_sold ? 'Relist Item' : 'Mark as Sold'
                    )}
                  </button>
                  <div className="flex gap-3">
                    {!listing.is_sold && (
                      <Link
                        to={`/listings/${id}/edit`}
                        className="btn-secondary flex-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                    )}
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="btn-danger flex-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      {listing.contact && looksLikePhoneNumber(listing.contact) && (
                        <a
                          href={listing.is_sold ? '#' : getWhatsAppLink(listing.contact, listing.title)}
                          target={listing.is_sold ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          title={listing.is_sold ? "This item has been sold" : undefined}
                          className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-lg transition-all shadow-sm focus:outline-none ${listing.is_sold ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#1ebe5d] text-white focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]'}`}
                          onClick={(e) => { if (listing.is_sold) { e.preventDefault(); } else { handleContactClick(); } }}
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Chat on WhatsApp
                        </a>
                      )}
                      
                      {listing.contact && (
                        <a
                          href={listing.is_sold ? '#' : `tel:${listing.contact}`}
                          title={listing.is_sold ? "This item has been sold" : undefined}
                          className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all focus:outline-none ${listing.is_sold ? 'border border-gray-200 text-gray-400 cursor-not-allowed' : 'border-2 border-[#C8622A] text-[#C8622A] hover:bg-[#C8622A]/10 focus:ring-2 focus:ring-offset-2 focus:ring-[#C8622A]'}`}
                          onClick={(e) => { if (listing.is_sold) { e.preventDefault(); } else { handleContactClick(); } }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call Seller
                        </a>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => toggleSave({ listingId: id, isSaved })}
                          disabled={savePending}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            isSaved
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <svg className={`w-4 h-4 ${isSaved ? 'fill-red-600' : ''}`} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {isSaved ? 'Saved' : 'Save'}
                        </button>

                        <button
                          onClick={handleShare}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {copied ? '✓ Copied!' : '↗ Share'}
                        </button>
                      </div>
                      
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-red-500/70 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Report Listing
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-[#6B6B6B] mb-4">
                        Log in to see contact information
                      </p>
                      <Link 
                        to="/login" 
                        state={{ from: { pathname: `/listings/${id}` } }} 
                        className="inline-block w-full bg-[#C8622A] hover:bg-[#B5561F] text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm transition-colors"
                      >
                        Log in to Contact
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Seller Info Section - hidden for listing owner and non-logged-in users */}
            {!isOwner && isAuthenticated && (

              <SellerInfo seller={listing.seller} sellerId={listing.user_id} />
            )}

            </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 space-y-6">
          {/* Review Form - Show for logged in non-owners who haven't reviewed yet, or when editing */}
          {(canReview || editingReview) && (
            <ReviewForm
              key={editingReview?.id || 'new'}
              listingId={id}
              existingReview={editingReview}
              onCancel={editingReview ? handleCancelEdit : undefined}
            />
          )}
          
          {/* Review gate: must contact seller first */}
          {!isOwner && user && reviewGate?.reason === 'no_contact' && !userReview && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">Want to leave a review?</p>
              <p>Contact the seller via WhatsApp or phone first, then come back to share your experience.</p>
            </div>
          )}

          {/* Review gate: already reviewed (from backend) */}
          {reviewGate?.reason === 'already_reviewed' && !userReview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
              You have already reviewed this listing.
            </div>
          )}

          {/* If user already has a review but isn't editing, show prompt */}
          {userReview && !editingReview && (
            <div className="card-static p-4 sm:p-5 bg-primary/5 border-primary/10">
              <p className="text-sm text-text-secondary">
                You have already reviewed this listing. 
                <button
                  onClick={() => handleEditReview(userReview)}
                  className="ml-1 text-primary font-medium hover:underline"
                >
                  Edit your review
                </button>
              </p>
            </div>
          )}
          
          {/* Login prompt for non-authenticated users (only if not owner) */}
          {!isAuthenticated && !isOwner && (
            <div className="card-static p-4 sm:p-5 text-center">
              <p className="text-text-secondary mb-3">
                Want to leave a review?
              </p>
              <Link
                to="/login"
                state={{ from: { pathname: `/listings/${id}` } }}
                className="btn-primary inline-flex"
              >
                Log in to review
              </Link>
            </div>
          )}
          
          {/* Reviews List */}
          <ReviewList
            reviews={reviews}
            listingId={id}
            isLoading={reviewsLoading}
            onEditReview={handleEditReview}
          />
        </div>

        {/* Related Listings */}
        {sellerListings.length > 0 && (
          <div className="mt-12 space-y-4">
            <h2 className="text-xl font-bold text-text">
              <Link to={`/sellers/${listing.user_id}`} className="hover:text-primary transition-colors">
                More from {listing.seller?.display_name || 'this seller'}
              </Link>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellerListings.map(item => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        )}

        {similarListings.length > 0 && (
          <div className="mt-12 space-y-4">
            <h2 className="text-xl font-bold text-text">Similar items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarListings.map(item => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Listing"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-text-secondary mb-2">
            Are you sure you want to delete this listing?
          </p>
          <p className="font-semibold text-text mb-4">
            &quot;{listing.title}&quot;
          </p>
          <p className="text-sm text-error mb-6">
            This action cannot be undone.
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
              <span>Delete Listing</span>
            )}
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Listing"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Report listings that are fraudulent, abusive, or violate marketplace rules.
          </p>

          <div className="form-group">
            <label htmlFor="report-reason" className="label">Reason</label>
            <input
              id="report-reason"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="input"
              maxLength={120}
              placeholder="Example: Suspected scam / misleading details"
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-details" className="label">Details (optional)</label>
            <textarea
              id="report-details"
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              className="input"
              maxLength={2000}
              rows={4}
              placeholder="Add context to help moderators review faster"
            />
          </div>
        </div>

        <ModalFooter>
          <button onClick={() => setShowReportModal(false)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmitReport}
            disabled={createReportMutation.isPending}
            className="btn-danger"
          >
            Submit Report
          </button>
        </ModalFooter>
      </Modal>

      {/* Fullscreen Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={allImages}
          initialIndex={activeImageIndex}
          onClose={() => setShowLightbox(false)}
          title={listing?.title}
        />
      )}
    </div>
  );
}
