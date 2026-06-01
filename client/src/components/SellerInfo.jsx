import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import AvatarImage from './AvatarImage';

/**
 * Format date as "Member since Month Year"
 */
function formatMemberSince(dateString) {
  if (!dateString) return 'Member';
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long' };
  return `Member since ${date.toLocaleDateString('en-US', options)}`;
}

/**
 * SellerInfo component displays seller details on listing page
 * 
 * @param {Object} props
 * @param {Object} props.seller - Seller object with id, display_name, created_at
 * @param {string} props.sellerId - Seller user ID for the "View all listings" link
 */
export default function SellerInfo({ seller, sellerId }) {
  if (!seller && !sellerId) return null;

  const displayName = seller?.display_name || 'Seller';
  const memberSince = formatMemberSince(seller?.created_at);

  return (
    <div className="bg-white border border-[#F0EDE8] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <h2 className="font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#C8622A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        About the Seller
      </h2>
      
      <div className="flex items-center gap-4">
        <AvatarImage 
          src={seller?.avatar_url} 
          name={displayName}
          size="lg"
          className="shadow-md border border-border-light"
        />
        
        {/* Seller details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/sellers/${sellerId || seller?.id}`} className="font-semibold text-[#1A1A1A] text-lg truncate hover:text-[#C8622A] transition-colors">
              {displayName}
            </Link>
            {seller?.verified_seller && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {memberSince}
          </p>
        </div>
      </div>
      
      {seller?.bio && (
        <div className="mt-4 mb-2 bg-gray-50 rounded-lg p-3 border border-border-light text-sm text-text-secondary">
          <p className="line-clamp-3">{seller.bio}</p>
        </div>
      )}
      
      {/* View all listings link */}
      <Link
        to={`/sellers/${sellerId || seller?.id}`}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#C8622A] bg-[#C8622A]/5 hover:bg-[#C8622A]/10 rounded-xl transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        View all listings by this seller
      </Link>
    </div>
  );
}

/**
 * Compact avatar for use in review lists
 */
export function SellerAvatar({ name, avatarUrl, size = 'md' }) {
  return (
    <AvatarImage
      src={avatarUrl}
      name={name}
      size={size}
      className="shadow-sm border border-border-light"
    />
  );
}
