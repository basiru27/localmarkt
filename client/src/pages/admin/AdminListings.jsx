import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminDeleteListing, useAdminListings, useModerateListing, adminKeys } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatRelativeDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import SafeImage from '../../components/SafeImage';
import Modal, { ModalFooter } from '../../components/Modal';
import Pagination from '../../components/ui/Pagination';

export default function AdminListings() {
  useDocumentTitle('Manage Listings');

  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const [search, setSearch] = useState('');
  const [selectedListings, setSelectedListings] = useState(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmDeleteListingId, setConfirmDeleteListingId] = useState(null);
  const [confirmDeleteListingTitle, setConfirmDeleteListingTitle] = useState('');
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const filters = useMemo(() => {
    const next = { page, limit: 20 };
    if (statusFilter !== 'all') next.status = statusFilter;
    if (search.trim()) next.search = search.trim();
    return next;
  }, [statusFilter, search, page]);

  const { data, isLoading, isError, error } = useAdminListings(filters);
  const listings = data?.data || [];
  const pagination = data?.pagination;
  const moderateMutation = useModerateListing();
  const deleteMutation = useAdminDeleteListing();

  useEffect(() => {
    const channel = supabase
      .channel('admin:listings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        () => {
          queryClient.invalidateQueries({ queryKey: adminKeys.listings(filters), exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, filters]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedListings(new Set());
  }, [filters]);

  const handleModeration = async (listingId, moderation_status) => {
    let moderation_note = '';
    if (moderation_status === 'rejected') {
      moderation_note = window.prompt("Reason for rejection:");
      if (moderation_note === null) return; // cancelled
    }

    try {
      await moderateMutation.mutateAsync({
        listingId,
        data: {
          moderation_status,
          moderation_note
        },
      });

      success(moderation_status === 'approved' ? 'Listing approved' : 'Listing rejected');
    } catch (err) {
      showError(err.message || 'Failed to moderate listing');
    }
  };

  const handleDelete = async (listingId, title) => {
    setConfirmDeleteListingId(listingId);
    setConfirmDeleteListingTitle(title);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteListingId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteListingId);
      success('Listing removed');
      setConfirmDeleteListingId(null);
      setConfirmDeleteListingTitle('');
    } catch (err) {
      showError(err.message || 'Failed to remove listing');
    }
  };

  const toggleSelection = (listingId) => {
    setSelectedListings(prev => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  };

  const toggleAll = () => {
    if (!listings) return;
    if (selectedListings.size === listings.length && listings.length > 0) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(listings.map(l => l.id)));
    }
  };

  const handleBulkModeration = async (moderation_status) => {
    if (selectedListings.size === 0) return;
    
    let moderation_note = '';
    if (moderation_status === 'rejected') {
      moderation_note = window.prompt("Reason for rejection for selected listings:");
      if (moderation_note === null) return;
    }

    setIsBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedListings).map(listingId => 
          moderateMutation.mutateAsync({
            listingId,
            data: { moderation_status, moderation_note }
          })
        )
      );
      success(`Bulk ${moderation_status} successful`);
      setSelectedListings(new Set());
    } catch (err) {
      showError(err.message || 'Failed to moderate some listings');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedListings.size === 0) return;
    if (!window.confirm(`Delete ${selectedListings.size} listings? This cannot be undone.`)) return;
    
    setIsBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedListings).map(listingId => 
          deleteMutation.mutateAsync(listingId)
        )
      );
      success('Bulk deletion successful');
      setSelectedListings(new Set());
    } catch (err) {
      showError(err.message || 'Failed to delete some listings');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const allSelected = listings && listings.length > 0 && selectedListings.size === listings.length;

  return (
    <div className={`space-y-5 ${selectedListings.size > 0 ? 'pb-24' : ''}`}>
      <div>
        <h2 className="text-2xl font-bold text-text">Listing Moderation</h2>
        <p className="text-text-secondary">Approve, reject, or remove marketplace listings.</p>
      </div>

      <div className="card-static p-4 grid grid-cols-1 md:grid-cols-[auto_180px_1fr] gap-3 items-center">
        <div className="flex items-center gap-2 pr-4 border-r border-border-light">
          <input 
            type="checkbox" 
            checked={allSelected} 
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            disabled={!listings || listings.length === 0}
            id="selectAll"
          />
          <label htmlFor="selectAll" className="text-sm font-medium select-none cursor-pointer">
            Select All
          </label>
        </div>

        <select value={statusFilter} onChange={(event) => {
          const value = event.target.value;
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value === 'all') next.delete('status');
            else next.set('status', value);
            return next;
          });
        }} className="input py-2">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input py-2"
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
            <article 
              key={listing.id} 
              className={`card-static p-4 transition-colors ${selectedListings.has(listing.id) ? 'bg-primary-50 border-primary/30' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="pt-1 hidden md:block">
                  <input 
                    type="checkbox"
                    checked={selectedListings.has(listing.id)}
                    onChange={() => toggleSelection(listing.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
                
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex items-center gap-3">
                  <div className="md:hidden pl-2">
                    <input 
                      type="checkbox"
                      checked={selectedListings.has(listing.id)}
                      onChange={() => toggleSelection(listing.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <SafeImage src={listing.image_url} alt="Thumbnail" category={listing.category?.name} className="w-full h-full object-cover" placeholderClassName="w-full h-full" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="badge-secondary uppercase tracking-wide">{listing.moderation_status}</span>
                    {listing.seller?.is_banned && <span className="badge-error">Seller banned</span>}
                  </div>
                  <h3 className="font-semibold text-text text-lg truncate">{listing.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatPrice(listing.price)} • {listing.category?.name || 'Unknown category'} • {listing.area?.name || 'Unknown area'}
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    Seller: {listing.seller?.display_name || 'Unknown'} • Posted {formatRelativeDate(listing.created_at)}
                  </p>
                  {listing.description && (
                    <details className="mt-2 text-sm text-text-secondary">
                      <summary className="cursor-pointer text-primary">View Description</summary>
                      <p className="mt-2 whitespace-pre-wrap">{listing.description}</p>
                    </details>
                  )}
                  {listing.moderation_note && (
                    <p className="text-xs text-error mt-2">Moderation Note: {listing.moderation_note}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  {listing.moderation_status !== 'approved' && (
                    <button
                      onClick={() => handleModeration(listing.id, 'approved')}
                      disabled={moderateMutation.isPending}
                      className="btn-primary !py-1.5 !px-3 !text-xs w-full sm:w-auto"
                    >
                      Approve
                    </button>
                  )}

                  {listing.moderation_status !== 'rejected' && (
                    <button
                      onClick={() => handleModeration(listing.id, 'rejected')}
                      disabled={moderateMutation.isPending}
                      className="btn-secondary !py-1.5 !px-3 !text-xs w-full sm:w-auto"
                    >
                      Reject
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(listing.id, listing.title)}
                    disabled={deleteMutation.isPending}
                      className="btn-danger !py-1.5 !px-3 !text-xs w-full sm:w-auto"
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

      {pagination && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}

      {selectedListings.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-200 z-50 flex items-center justify-between px-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <span className="text-sm font-medium text-text">{selectedListings.size} selected</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => handleBulkModeration('approved')} 
              disabled={isBulkLoading}
              className="btn-primary !py-1.5 !px-3 sm:!px-4 !text-xs sm:!text-sm"
            >
              Approve All
            </button>
            <button 
              onClick={() => handleBulkModeration('rejected')} 
              disabled={isBulkLoading}
              className="btn-secondary !py-1.5 !px-3 sm:!px-4 !text-xs sm:!text-sm"
            >
              Reject All
            </button>
            <button 
              onClick={handleBulkDelete} 
              disabled={isBulkLoading}
              className="btn-danger !py-1.5 !px-3 sm:!px-4 !text-xs sm:!text-sm"
            >
              Delete All
            </button>
            <button 
              onClick={() => setSelectedListings(new Set())} 
              disabled={isBulkLoading}
              className="text-xs sm:text-sm text-text-secondary px-2 hover:text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!confirmDeleteListingId}
        onClose={() => { setConfirmDeleteListingId(null); setConfirmDeleteListingTitle(''); }}
        title="Delete Listing"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-text-secondary mb-2">Are you sure you want to delete this listing?</p>
          <p className="font-semibold text-text mb-4">&ldquo;{confirmDeleteListingTitle}&rdquo;</p>
          <p className="text-sm text-error mb-6">This action cannot be undone.</p>
        </div>
        <ModalFooter>
          <button onClick={() => { setConfirmDeleteListingId(null); setConfirmDeleteListingTitle(''); }} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirmDelete} disabled={deleteMutation.isPending} className="btn-danger">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Listing'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
