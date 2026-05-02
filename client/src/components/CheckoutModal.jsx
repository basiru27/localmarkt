import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOffline } from '../context/OfflineContext';
import { ordersApi } from '../lib/api';
import Modal, { ModalFooter } from './Modal';
import { formatPrice } from '../lib/utils';

export default function CheckoutModal({ isOpen, onClose, listing }) {
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAuthHeader } = useAuth();
  const { success, error: showError } = useToast();
  const { isOnline } = useOffline();

  if (!listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      showError('You must be online to complete a purchase.');
      return;
    }
    
    if (!reference.trim()) {
      showError('Please enter a payment reference.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authHeader = await getAuthHeader();
      
      // 1. Create the order
      const order = await ordersApi.create({ listing_id: listing.id }, authHeader);
      
      // 2. Update status with payment reference
      await ordersApi.updateStatus(
        order.id, 
        { status: 'buyer_paid', payment_reference: reference.trim() }, 
        authHeader
      );

      success('Payment submitted successfully! The seller will review it.');
      onClose();
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sellerName = listing.seller?.display_name || 'the seller';
  const sellerPhone = listing.seller?.phone_number || '';
  const instructions = sellerPhone 
    ? `Please send the payment to ${sellerName} via mobile money at ${sellerPhone}.` 
    : `Please coordinate with ${sellerName} to arrange mobile money payment.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Checkout">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="font-semibold text-text text-lg">{listing.title}</h3>
            <p className="text-primary font-bold text-xl">{formatPrice(listing.price)}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-border-light">
            <h4 className="font-medium text-text mb-2">Mobile Money Instructions</h4>
            <p className="text-text-secondary text-sm">{instructions}</p>
          </div>

          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-text mb-1">
              Payment Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-white"
              placeholder="e.g. Transaction ID or sender number"
              required
            />
          </div>
        </div>
        
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || !reference.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'I have sent the money'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
