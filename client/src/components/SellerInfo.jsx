import { Link } from 'react-router-dom';

/**
 * Get initials from a display name
 */
function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Generate a consistent color based on user ID
 */
function getAvatarColor(userId) {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-lime-500 to-green-600',
    'from-red-500 to-pink-600',
  ];
  
  if (!userId) return colors[0];
  
  // Simple hash from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

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
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(sellerId || seller?.id);
  const memberSince = formatMemberSince(seller?.created_at);

  return (
    <div className="card-static p-4 sm:p-5">
      <h2 className="font-semibold text-text mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        About the Seller
      </h2>
      
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
          {initials}
        </div>
        
        {/* Seller details */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text text-lg truncate">
            {displayName}
          </p>
          <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {memberSince}
          </p>
        </div>
      </div>
      
      {/* View all listings link */}
      <Link
        to={`/?user_id=${sellerId || seller?.id}`}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors"
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
export function SellerAvatar({ name, userId, size = 'md' }) {
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(userId);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold shadow-sm`}>
      {initials}
    </div>
  );
}
