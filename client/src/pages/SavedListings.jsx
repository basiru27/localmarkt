import { useSavedListings } from '../hooks/useSaved';
import ListingCard from '../components/ListingCard';
import { Heart, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SavedListings() {
  const { data: saved = [], isLoading, isError } = useSavedListings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C8622A]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">
            Could not load your saved listings. Please try again.
          </p>
          <Link to="/" className="text-orange-600 font-medium hover:underline">
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {saved.length} {saved.length === 1 ? 'listing' : 'listings'} saved
          </p>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved listings yet</h3>
          <p className="text-gray-500 mb-6">
            Tap the heart icon on any listing to save it for later.
          </p>
          <Link to="/" className="text-orange-600 font-medium hover:underline">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {saved.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
