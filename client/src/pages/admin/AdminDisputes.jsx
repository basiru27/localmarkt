import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminApi, ordersApi } from '../../lib/api';
import { adminKeys } from '../../hooks/useAdmin';
import { formatPrice, formatRelativeDate } from '../../lib/utils';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { supabase } from '../../lib/supabase';

export default function AdminDisputes() {
  const { getAuthHeader } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [submittingId, setSubmittingId] = useState(null);

  const { data: disputes, isLoading, isError, error } = useQuery({
    queryKey: adminKeys.disputes(),
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      const response = await adminApi.getDisputes(authHeader);
      return response || [];
    },
    staleTime: 0
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin:disputes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: 'status=eq.disputed' },
        (payload) => {
          console.log('Realtime event received in AdminDisputes:', payload);
          queryClient.invalidateQueries({ queryKey: adminKeys.disputes(), exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const authHeader = await getAuthHeader();
      return ordersApi.updateStatus(orderId, { status }, authHeader);
    },
    onMutate: ({ orderId }) => setSubmittingId(orderId),
    onSuccess: () => {
      success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.disputes() });
    },
    onError: (err) => {
      showError(err.message || 'Failed to update order status');
    },
    onSettled: () => {
      setSubmittingId(null);
    },
  });

  const handleAction = (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) {
      return;
    }
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-static p-4 skeleton h-32" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card-static p-5" role="alert">
        <h2 className="font-semibold text-text mb-2">Failed to load disputes</h2>
        <p className="text-sm text-text-secondary">{error?.message || 'Please try again.'}</p>
      </div>
    );
  }

  if (!disputes?.length) {
    return (
      <div className="card-static p-8 text-center">
        <svg className="w-12 h-12 text-text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-medium text-text mb-1">No Active Disputes</h2>
        <p className="text-text-secondary">All clear! There are currently no orders in dispute.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text">Active Disputes</h2>
          <p className="text-sm text-text-secondary mt-1">Review and resolve order conflicts.</p>
        </div>
        <div className="text-sm font-medium text-text">
          Total: {disputes.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {disputes.map((dispute) => (
          <div key={dispute.id} className="card-static p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <OrderStatusBadge status={dispute.status} />
                  <span className="text-sm text-text-secondary">{formatRelativeDate(dispute.updated_at)}</span>
                </div>
                <h3 className="font-semibold text-text text-lg">
                  {dispute.listing?.title || 'Unknown Listing'}
                </h3>
                <div className="text-primary font-bold mt-1">
                  {formatPrice(dispute.price_at_purchase)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                <button
                  onClick={() => handleAction(dispute.id, 'completed')}
                  disabled={submittingId === dispute.id}
                  className="btn-primary py-1.5 px-3 text-sm"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleAction(dispute.id, 'cancelled')}
                  disabled={submittingId === dispute.id}
                  className="btn-danger py-1.5 px-3 text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                >
                  Cancel Order
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-gray-50 rounded p-3">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Buyer</h4>
                <p className="text-sm text-text font-medium">{dispute.buyer?.display_name || 'Unknown'}</p>
                <p className="text-xs text-text-secondary mt-1">{dispute.buyer?.email}</p>
                {dispute.buyer_note && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-text-secondary">Buyer Note:</span>
                    <p className="text-sm text-text mt-1 italic">&quot;{dispute.buyer_note}&quot;</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded p-3">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Seller</h4>
                <p className="text-sm text-text font-medium">{dispute.seller?.display_name || 'Unknown'}</p>
                <p className="text-xs text-text-secondary mt-1">{dispute.seller?.email}</p>
                {dispute.seller_note && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-text-secondary">Seller Note:</span>
                    <p className="text-sm text-text mt-1 italic">&quot;{dispute.seller_note}&quot;</p>
                  </div>
                )}
              </div>
            </div>

            {dispute.dispute_reason && (
              <div className="bg-red-50 border border-red-100 rounded p-3 mt-2">
                <h4 className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">Dispute Reason</h4>
                <p className="text-sm text-red-900">{dispute.dispute_reason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
