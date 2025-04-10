
import React from 'react';

type StatusType = 'paid' | 'refunded' | 'sent' | 'connected' | 'pending' | 'not_connected';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'paid':
      case 'connected':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'refunded':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sent':
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
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
