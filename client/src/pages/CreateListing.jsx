import { useNavigate } from 'react-router-dom';
import { useCreateListing } from '../hooks/useListings';
import { useOffline } from '../context/OfflineContext';
import ListingForm from '../components/ListingForm';

export default function CreateListing() {
  const navigate = useNavigate();
  const createMutation = useCreateListing();
  const { isOnline } = useOffline();

  const handleSubmit = async (data) => {
    try {
      const result = await createMutation.mutateAsync(data);
      
      if (result.pending) {
        // Saved offline
        alert('You are offline. Your listing has been saved and will be posted when you reconnect.');
        navigate('/');
      } else {
        // Posted successfully
        navigate(`/listings/${result.id}`);
      }
    } catch (error) {
      alert('Failed to create listing: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="container-app py-4 sm:py-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-text mb-6">
          Post a New Listing
        </h1>

        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
            You are offline. Your listing will be saved and posted when you reconnect.
          </div>
        )}

        <ListingForm
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
