import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOffline } from '../context/OfflineContext';
import { ordersApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { formatPrice, getPlaceholderImage } from '../lib/utils';
import OrderStatusBadge from '../components/OrderStatusBadge';
import DisputeModal from '../components/DisputeModal';

export default function MyPurchases() {
  const { user, getAuthHeader } = useAuth();
  const { isOnline } = useOffline();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [paymentReferences, setPaymentReferences] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchases', user?.id],
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      const response = await ordersApi.getPurchases(authHeader);
      return response?.data || [];
    },
    enabled: !!user?.id,
    staleTime: 0
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${user.id}` },
        (payload) => {
          console.log('Realtime event received in MyPurchases:', payload);
          queryClient.invalidateQueries({ queryKey: ['purchases', user.id], exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reference, dispute_reason }) => {
      const authHeader = await getAuthHeader();
      const payload = { status };
      if (reference) payload.payment_reference = reference;
      if (dispute_reason) payload.dispute_reason = dispute_reason;
      return ordersApi.updateStatus(id, payload, authHeader);
    },
    onSuccess: (_, variables) => {
      if (variables.status === 'buyer_paid') {
        success('Payment marked as sent! Waiting for seller to verify.');
      } else if (variables.status === 'disputed') {
        success('Dispute raised successfully. An admin will review it.');
        setDisputeModalOpen(false);
      } else if (variables.status === 'cancelled') {
        success('Order cancelled successfully.');
      }
      queryClient.invalidateQueries({ queryKey: ['purchases', user?.id] });
    },
    onError: (err) => {
      showError(err.message || 'Failed to update order status');
    },
    onSettled: () => {
      setSubmittingId(null);
    }
  });

  const handleMarkPaid = (orderId) => {
    const reference = paymentReferences[orderId] || '';
    if (!reference.trim()) {
      showError('Please enter a payment reference first.');
      return;
    }
    
    if (!isOnline) {
      showError('You must be online to update your order.');
      return;
    }

    setSubmittingId(orderId);
    updateStatusMutation.mutate({ id: orderId, status: 'buyer_paid', reference: reference.trim() });
  };

  const handleCancelOrder = (orderId) => {
    if (!isOnline) {
      showError('You must be online to cancel an order.');
      return;
    }
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setSubmittingId(orderId);
      updateStatusMutation.mutate({ id: orderId, status: 'cancelled' });
    }
  };

  const handleRaiseDispute = (reason) => {
    if (!isOnline) {
      showError('You must be online to raise a dispute.');
      return;
    }
    setSubmittingId(selectedOrderId);
    updateStatusMutation.mutate({ id: selectedOrderId, status: 'disputed', dispute_reason: reason });
  };

  const openDisputeModal = (orderId) => {
    setSelectedOrderId(orderId);
    setDisputeModalOpen(true);
  };

  const handleReferenceChange = (orderId, value) => {
    setPaymentReferences(prev => ({ ...prev, [orderId]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Purchases</h1>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Failed to load purchases. Please try again later.
        </div>
      ) : data?.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h3>
          <p className="text-gray-500 mb-4">You haven't bought any items yet.</p>
          <Link to="/" className="btn-primary inline-flex">Browse Listings</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="h-32 w-full md:w-32 flex-shrink-0 bg-gray-100">
                {order.listing?.image_url ? (
                  <img src={order.listing.image_url} alt={`Image of ${order.listing.title}`} className="h-full w-full object-cover" />
                ) : (
                  <img src={getPlaceholderImage('Listing')} alt="Placeholder for missing image" className="h-full w-full object-cover opacity-50" />
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/listings/${order.listing_id}`} className="font-semibold text-lg text-gray-900 hover:text-primary transition-colors">
                      {order.listing?.title || 'Unknown Listing'}
                    </Link>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-primary font-bold">{formatPrice(order.price_at_purchase)}</p>
                  <p className="text-sm text-gray-500 mt-1">Seller: {order.seller?.display_name || 'Unknown'}</p>
                  {order.seller?.phone_number && (
                    <p className="text-sm text-gray-500">Contact: {order.seller.phone_number}</p>
                  )}
                  {order.payment_reference && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {order.payment_reference}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  {order.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                      <div className="flex-1 w-full">
                        <label htmlFor={`ref-${order.id}`} className="sr-only">Payment Reference</label>
                        <input
                          id={`ref-${order.id}`}
                          type="text"
                          placeholder="Enter payment reference (e.g. TXN ID)"
                          className="input w-full text-sm"
                          value={paymentReferences[order.id] || ''}
                          onChange={(e) => handleReferenceChange(order.id, e.target.value)}
                          disabled={submittingId === order.id || !isOnline}
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={submittingId === order.id || !isOnline}
                          className="btn-secondary whitespace-nowrap flex-1 sm:flex-none text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleMarkPaid(order.id)}
                          disabled={submittingId === order.id || !isOnline || !paymentReferences[order.id]?.trim()}
                          className="btn-primary whitespace-nowrap flex-1 sm:flex-none"
                        >
                          {submittingId === order.id ? 'Submitting...' : 'Mark as Paid'}
                        </button>
                      </div>
                    </div>
                  )}
                  {order.status === 'buyer_paid' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => openDisputeModal(order.id)}
                        disabled={submittingId === order.id || !isOnline}
                        className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                      >
                        Raise Dispute
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <DisputeModal 
        isOpen={disputeModalOpen} 
        onClose={() => setDisputeModalOpen(false)}
        onSubmit={handleRaiseDispute}
        isSubmitting={submittingId === selectedOrderId}
      />
    </div>
  );
}
