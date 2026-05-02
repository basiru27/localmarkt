import React from 'react';

export default function OrderStatusBadge({ status, className = '' }) {
  const config = {
    pending: { label: 'Pending Payment', classes: 'bg-amber-100 text-amber-800' },
    buyer_paid: { label: 'Paid (Verifying)', classes: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', classes: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', classes: 'bg-gray-100 text-gray-800' },
    disputed: { label: 'Disputed', classes: 'bg-red-100 text-red-800' },
  };

  const { label, classes } = config[status] || { label: status || 'Unknown', classes: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}>
      {label}
    </span>
  );
}
