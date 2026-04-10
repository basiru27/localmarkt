import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateListing } from '../hooks/useListings';
import { useOffline } from '../context/OfflineContext';
import { useToast } from '../context/ToastContext';
import ListingForm from '../components/ListingForm';

export default function CreateListing() {
  const navigate = useNavigate();
  const createMutation = useCreateListing();
  const { isOnline } = useOffline();
  const { success, error: showError, warning } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (data) => {
    try {
      const result = await createMutation.mutateAsync(data);
      
      if (result.pending) {
        // Saved offline - show inline message instead of alert
        warning('Your listing will be posted when you reconnect');
        setShowSuccess('offline');
        setTimeout(() => navigate('/'), 2000);
      } else {
        // Posted successfully
        success('Listing submitted for review. It will appear after admin approval.');
        navigate(`/listings/${result.id}`);
      }
    } catch (error) {
      showError('Failed to create listing: ' + (error.message || 'Unknown error'));
    }
  };

  if (showSuccess === 'offline') {
    return (
      <div className="container-app py-12">
        <div className="max-w-md mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text mb-3">Saved for Later</h2>
          <p className="text-text-secondary mb-6">
            You're offline. Your listing has been saved and will be posted automatically when you reconnect.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/" className="btn-primary">
              Go to Home
            </Link>
          </div>
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
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary mb-4 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text">
                Post a New Listing
              </h1>
              <p className="text-text-secondary">
                Fill in the details to start selling
              </p>
            </div>
          </div>
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <div className="alert alert-warning mb-6 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">You're offline</p>
              <p className="text-sm opacity-90">Your listing will be saved and posted when you reconnect.</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="card-static p-5 sm:p-6">
          <ListingForm
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
          />
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary/10">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Tips for a great listing
          </h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Use a clear, descriptive title</li>
            <li>• Add a high-quality photo of your item</li>
            <li>• Set a competitive price</li>
            <li>• Include all relevant details in the description</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
