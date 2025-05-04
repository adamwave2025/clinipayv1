
import React from 'react';

type StatusType = 'paid' | 'refunded' | 'partially_refunded' | 'sent' | 'connected' | 'pending' | 'not_connected' | 'upcoming' | 'overdue' | 'paused' | 'cancelled' | 'active' | 'completed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'paid':
      case 'connected':
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'refunded':
      case 'partially_refunded':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sent':
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'upcoming':
      case 'completed':
        return 'bg-gradient-primary text-white border-transparent';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
      case 'not_connected':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDisplayText = () => {
    // Specifically handle Stripe connection statuses
    if (status === 'connected') return 'Connected';
    if (status === 'pending') return 'Pending';
    if (status === 'not_connected') return 'Not Connected';
    if (status === 'partially_refunded') return 'Partially Refunded';
    if (status === 'active') return 'Active';
    if (status === 'completed') return 'Completed';
    
    // Standard formatting for other statuses
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
        border ${getStatusStyles()} ${className}
      `}
    >
      {getDisplayText()}
    </span>
  );
};

export default StatusBadge;
