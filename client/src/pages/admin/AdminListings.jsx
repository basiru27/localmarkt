import { useMemo, useState } from 'react';
import { useAdminDeleteListing, useAdminListings, useModerateListing } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatRelativeDate } from '../../lib/utils';

export default function AdminListings() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { success, error: showError } = useToast();

  const filters = useMemo(() => {
    const next = {};
    if (statusFilter !== 'all') next.status = statusFilter;
    if (search.trim()) next.search = search.trim();
    return next;
  }, [statusFilter, search]);

  const { data: listings, isLoading, isError, error } = useAdminListings(filters);
  const moderateMutation = useModerateListing();
  const deleteMutation = useAdminDeleteListing();

  const handleModeration = async (listingId, moderation_status) => {
    try {
      await moderateMutation.mutateAsync({
        listingId,
        data: {
          moderation_status,
        },
      });

      success(moderation_status === 'approved' ? 'Listing approved' : 'Listing rejected');
    } catch (err) {
      showError(err.message || 'Failed to moderate listing');
    }
  };

  const handleDelete = async (listingId) => {
    try {
      await deleteMutation.mutateAsync(listingId);
      success('Listing removed');
    } catch (err) {
      showError(err.message || 'Failed to remove listing');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-text">Listing Moderation</h2>
        <p className="text-text-secondary">Approve, reject, or remove marketplace listings.</p>
      </div>

      <div className="card-static p-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input"
          placeholder="Search listing title"
        />
      </div>

      {isLoading && (
        <div className="card-static p-5">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-11 w-full" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="card-static p-5" role="alert">
          <p className="text-sm text-error">{error?.message || 'Failed to load listings'}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {listings?.map((listing) => (
            <article key={listing.id} className="card-static p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="badge-secondary uppercase tracking-wide">{listing.moderation_status}</span>
                    {listing.seller?.is_banned && <span className="badge-error">Seller banned</span>}
                  </div>
                  <h3 className="font-semibold text-text text-lg truncate">{listing.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatPrice(listing.price)} • {listing.category?.name || 'Unknown category'} • {listing.region?.name || 'Unknown region'}
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    Seller: {listing.seller?.display_name || 'Unknown'} • Posted {formatRelativeDate(listing.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {listing.moderation_status !== 'approved' && (
                    <button
                      onClick={() => handleModeration(listing.id, 'approved')}
                      disabled={moderateMutation.isPending}
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      Approve
                    </button>
                  )}

                  {listing.moderation_status !== 'rejected' && (
                    <button
                      onClick={() => handleModeration(listing.id, 'rejected')}
                      disabled={moderateMutation.isPending}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      Reject
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(listing.id)}
                    disabled={deleteMutation.isPending}
                    className="btn-danger py-1.5 px-3 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}

          {listings?.length === 0 && (
            <div className="card-static p-5 text-center text-text-secondary">No listings found.</div>
          )}
        </div>
      )}
    </div>
  );
}
