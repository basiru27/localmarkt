import { useState } from 'react';
import Modal, { ModalFooter } from './Modal';

export default function DisputeModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raise a Dispute">
      <form onSubmit={handleSubmit}>
        <div className="p-1">
          <p className="text-sm text-text-secondary mb-4">
            If there is a problem with your order that you cannot resolve with the other party, 
            you can raise a dispute. An administrator will review the case.
          </p>
          <label htmlFor="dispute-reason" className="block text-sm font-medium text-text mb-1">
            Reason for Dispute <span className="text-error">*</span>
          </label>
          <textarea
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input w-full"
            rows={4}
            maxLength={1000}
            required
            placeholder="Please explain the issue clearly..."
          />
          <p className="text-xs text-text-muted mt-1 text-right">
            {reason.length} / 1000
          </p>
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
            className="btn-danger"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
