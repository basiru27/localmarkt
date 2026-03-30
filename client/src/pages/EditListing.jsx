import { useParams, useNavigate } from 'react-router-dom';
import { useListing, useUpdateListing } from '../hooks/useListings';
import { useAuth } from '../context/AuthContext';
import ListingForm from '../components/ListingForm';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, isLoading, isError } = useListing(id);
  const updateMutation = useUpdateListing();

  // Check ownership
  const isOwner = user && listing && user.id === listing.user_id;

  const handleSubmit = async (data) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      navigate(`/listings/${id}`);
    } catch (error) {
      alert('Failed to update listing: ' + (error.message || 'Unknown error'));
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-6">
        <div className="max-w-xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="skeleton h-8 w-48 mb-6" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="container-app py-12 text-center">
        <h2 className="text-xl font-semibold text-text mb-2">Listing not found</h2>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          Go back
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container-app py-12 text-center">
        <h2 className="text-xl font-semibold text-text mb-2">Access Denied</h2>
        <p className="text-text-secondary mb-4">
          You can only edit your own listings
        </p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="container-app py-4 sm:py-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-text mb-6">
          Edit Listing
        </h1>

        <ListingForm
          initialData={listing}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
