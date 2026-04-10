import { useParams, useNavigate, Link } from 'react-router-dom';
import { useListing, useUpdateListing } from '../hooks/useListings';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ListingForm from '../components/ListingForm';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const { data: listing, isLoading, isError } = useListing(id);
  const updateMutation = useUpdateListing();

  // Check ownership
  const isOwner = user && listing && user.id === listing.user_id;

  const handleSubmit = async (data) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      success('Listing updated and resubmitted for admin review.');
      navigate(`/listings/${id}`);
    } catch (error) {
      showError('Failed to update listing: ' + (error.message || 'Unknown error'));
    }
  };

  if (isLoading) {
    return (
      <div className="container-app py-6">
        <div className="max-w-xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-6">
            <div className="skeleton w-24 h-6 rounded mb-4" />
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div>
                <div className="skeleton w-48 h-8 rounded mb-2" />
                <div className="skeleton w-32 h-4 rounded" />
              </div>
            </div>
          </div>
          
          {/* Form skeleton */}
          <div className="card-static p-6 space-y-6">
            <div className="space-y-2">
              <div className="skeleton w-16 h-4 rounded" />
              <div className="skeleton w-full h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="skeleton w-24 h-4 rounded" />
              <div className="skeleton w-full h-32 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="skeleton w-20 h-4 rounded" />
              <div className="skeleton w-full h-12 rounded-xl" />
            </div>
            <div className="skeleton w-full h-12 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="container-app py-12">
        <div className="empty-state animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Listing not found</h2>
          <p className="text-text-secondary mb-6">
            This listing may have been removed or doesn't exist.
          </p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container-app py-12">
        <div className="empty-state animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Access Denied</h2>
          <p className="text-text-secondary mb-6">
            You can only edit your own listings.
          </p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-4 sm:py-6">
      <div className="max-w-xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/listings/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary mb-4 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to listing
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text">
                Edit Listing
              </h1>
              <p className="text-text-secondary">
                Update your listing details
              </p>
            </div>
          </div>
        </div>

        {/* Current listing info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-4">
          {listing.image_url && (
            <img 
              src={listing.image_url} 
              alt={listing.title} 
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-text truncate">{listing.title}</p>
            <p className="text-sm text-text-secondary">
              Editing listing #{id?.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="card-static p-5 sm:p-6">
          <ListingForm
            initialData={listing}
            onSubmit={handleSubmit}
            isSubmitting={updateMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
