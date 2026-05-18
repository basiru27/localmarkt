import { useParams } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useListings } from '../hooks/useListings';
import { getInitials, getAvatarColor } from '../components/SellerInfo';
import ListingCard from '../components/ListingCard';
import { ListingGridSkeleton } from '../components/ListingCardSkeleton';

function formatMemberSinceShort(dateString) {
  if (!dateString) return 'Member';
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short' };
  // Expected: "Apr 2026"
  return date.toLocaleDateString('en-US', options);
}

export default function SellerProfile() {
  const { id } = useParams();

  // Fetch seller profile directly from supabase (might return null for non-admins due to RLS)
  const { data: profileData, isLoading: sellerLoading } = useQuery({
    queryKey: ['sellerProfile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, created_at, bio, verified_seller')
        .eq('id', id)
        .maybeSingle();
        
      if (error) {
        console.error("Profile fetch error:", error);
        return null;
      }
      return data || null;
    },
    enabled: !!id,
  });

  useDocumentTitle(profileData?.display_name ? `${profileData.display_name}'s Profile` : 'Seller Profile');

  // Fetch their listings (this goes through backend and bypasses RLS)
  const { data: listingsData, isLoading: listingsLoading } = useListings({
    user_id: id,
    sort: 'newest',
    limit: 100 // Get a good chunk of active listings
  });

  // Filter for approved and non-sold listings
  const activeListings = listingsData?.data?.filter(
    item => !item.is_sold
  ) || [];

  // Derive seller from listings if RLS blocked the profile fetch
  const derivedSeller = listingsData?.data?.[0]?.seller || profileData;

  if (sellerLoading || listingsLoading) {
    return (
      <div className="container-app py-8 animate-pulse">
        <div className="max-w-4xl mx-auto">
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

  if (!derivedSeller) {
    return (
      <div className="container-app py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Seller not found</h2>
        <p className="text-gray-500">This seller profile may not exist or has been removed.</p>
      </div>
    );
  }

  const displayName = derivedSeller.display_name || 'Seller';
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(derivedSeller.id || id);

  return (
    <div className="container-app py-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Seller Profile Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-border-light mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar */}
            <div className="flex-shrink-0">
              {derivedSeller.avatar_url ? (
                <img 
                  src={derivedSeller.avatar_url} 
                  alt={displayName} 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md border-2 border-white"
                />
              ) : (
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-3xl shadow-md border-2 border-white`}>
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-text">
                  {displayName}
                </h1>
                {derivedSeller.verified_seller && (
                  <span className="inline-flex items-center justify-center text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full text-xs font-semibold mx-auto sm:mx-0">
                    <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              
              <p className="text-text-secondary text-sm mb-4">
                Member since {formatMemberSinceShort(derivedSeller.created_at)}
              </p>
              
              {derivedSeller.bio && (
                <p className="text-text max-w-2xl bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                  {derivedSeller.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">
            Active Listings
          </h2>
          <span className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">
            {activeListings.length}
          </span>
        </div>

        {listingsLoading ? (
          <ListingGridSkeleton count={8} />
        ) : activeListings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {activeListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-text-muted text-lg">No active listings from this seller</p>
          </div>
        )}

      </div>
    </div>
  );
}
