import useDocumentTitle from '../hooks/useDocumentTitle';
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

export default function MySales() {
  useDocumentTitle('My Sales');

  const { user, getAuthHeader } = useAuth();
  const { isOnline } = useOffline();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [submittingId, setSubmittingId] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sales', user?.id],
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      const response = await ordersApi.getSales(authHeader);
      return response?.data || [];
    },
    enabled: !!user?.id,
    staleTime: 0
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('sales-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          const record = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (record && record.seller_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['sales', user.id], exact: false });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, dispute_reason }) => {
      const authHeader = await getAuthHeader();
      const payload = { status };
      if (dispute_reason) payload.dispute_reason = dispute_reason;
      return ordersApi.updateStatus(id, payload, authHeader);
    },
    onSuccess: (_, variables) => {
      if (variables.status === 'completed') {
        success('Payment confirmed successfully! Order is completed.');
      } else if (variables.status === 'disputed') {
        success('Dispute raised successfully. An admin will review it.');
        setDisputeModalOpen(false);
      }
      queryClient.invalidateQueries({ queryKey: ['sales', user?.id] });
    },
    onError: (err) => {
      showError(err.message || 'Failed to update order status');
    },
    onSettled: () => {
      setSubmittingId(null);
    }
  });

  const handleConfirmPayment = (orderId) => {
    if (!isOnline) {
      showError('You must be online to confirm payment.');
      return;
    }

    setSubmittingId(orderId);
    updateStatusMutation.mutate({ id: orderId, status: 'completed' });
  };

  const handleMarkDelivered = (orderId) => {
    if (!isOnline) {
      showError('You must be online to mark as delivered.');
      return;
    }
    setSubmittingId(orderId);
    updateStatusMutation.mutate({ id: orderId, status: 'delivered' });
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

  const getTimelineSteps = (status) => {
    const steps = ['pending', 'buyer_paid', 'delivered', 'completed'];
    const currentIndex = steps.indexOf(status);
    
    // Handle edge cases
    if (status === 'cancelled') return [{ label: 'Cancelled', state: 'error' }];
    if (status === 'disputed') return [{ label: 'Disputed', state: 'error' }];
    if (status === 'accepted') return steps.map((s, i) => ({ step: s, state: i === 0 ? 'completed' : 'pending' }));
    if (status === 'rejected') return [{ label: 'Rejected', state: 'error' }];
    
    // Normal flow
    if (currentIndex === -1) return steps.map(s => ({ step: s, state: 'pending' }));
    
    return steps.map((s, i) => {
      if (i < currentIndex || (i === currentIndex && status === 'completed')) return { step: s, state: 'completed' };
      if (i === currentIndex) return { step: s, state: 'current' };
      return { step: s, state: 'pending' };
    });
  };

  const formatStepLabel = (step) => {
    switch(step) {
      case 'buyer_paid': return 'Paid';
      case 'completed': return 'Done';
      default: return step.charAt(0).toUpperCase() + step.slice(1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation Tabs (matches MyListings) */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            to="/my-listings"
            className="border-transparent text-text-secondary hover:border-border hover:text-text whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Active Listings
          </Link>
          <Link
            to="/my-listings/sales"
            className="border-primary text-primary whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
            aria-current="page"
          >
            Sales
          </Link>
          <Link
            to="/my-listings/analytics"
            className="border-transparent text-text-secondary hover:border-border hover:text-text whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Analytics
          </Link>
        </nav>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sales</h1>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Failed to load sales. Please try again later.
        </div>
      ) : data?.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sales yet</h3>
          <p className="text-gray-500 mb-4">You haven't sold any items yet.</p>
          <Link to="/my-listings" className="btn-primary inline-flex">View Active Listings</Link>
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
                  <p className="text-sm text-gray-500 mt-1">Buyer: {order.buyer?.display_name || 'Unknown'}</p>
                  {order.buyer?.phone_number && (
                    <p className="text-sm text-gray-500">Contact: {order.buyer.phone_number}</p>
                  )}
                  {order.payment_reference && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {order.payment_reference}</p>
                  )}
                  
                  {/* Delivery Status Timeline (Task 5E) */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      {getTimelineSteps(order.status).map((stepInfo, idx, arr) => {
                        if (stepInfo.state === 'error') {
                          return (
                            <div key="error" className="flex items-center text-red-500 text-sm font-medium">
                              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              {stepInfo.label}
                            </div>
                          );
                        }
                        
                        return (
                          <div key={stepInfo.step} className="flex-1 flex items-center relative">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs z-10 ${
                                stepInfo.state === 'completed' ? 'bg-primary text-white' :
                                stepInfo.state === 'current' ? 'bg-primary-light text-primary border-2 border-primary' :
                                'bg-gray-100 text-gray-400 border border-gray-200'
                              }`}>
                                {stepInfo.state === 'completed' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <span className={`text-[10px] mt-1 hidden sm:block ${stepInfo.state === 'pending' ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                                {formatStepLabel(stepInfo.step)}
                              </span>
                            </div>
                            {idx < arr.length - 1 && (
                              <div className={`absolute top-3 left-6 right-0 h-0.5 -mt-px ${
                                stepInfo.state === 'completed' ? 'bg-primary' : 'bg-gray-200'
                              }`} style={{ width: 'calc(100% - 24px)' }}></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {(order.status === 'buyer_paid' || order.status === 'delivered') && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <button
                        onClick={() => openDisputeModal(order.id)}
                        disabled={submittingId === order.id || !isOnline}
                        className="btn-secondary whitespace-nowrap w-full sm:w-auto text-red-600 hover:bg-red-50 hover:border-red-200"
                      >
                        Raise Dispute
                      </button>
                      
                      {order.status === 'buyer_paid' && (
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          disabled={submittingId === order.id || !isOnline}
                          className="btn-primary whitespace-nowrap w-full sm:w-auto"
                        >
                          {submittingId === order.id ? 'Updating...' : 'Mark as Delivered'}
                        </button>
                      )}
                      
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleConfirmPayment(order.id)}
                          disabled={submittingId === order.id || !isOnline}
                          className="btn-primary whitespace-nowrap w-full sm:w-auto"
                        >
                          {submittingId === order.id ? 'Confirming...' : 'Confirm Completed'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
