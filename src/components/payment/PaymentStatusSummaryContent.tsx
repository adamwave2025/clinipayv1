
import React from 'react';
import { CheckCircle2, AlertCircle, Clock, BanIcon, PauseCircle, AlertTriangle } from 'lucide-react';

interface PaymentStatusSummaryContentProps {
  status: 'success' | 'failed' | 'pending' | 'cancelled' | 'paused' | 'overdue';
  title: string;
  description: string;
}

const PaymentStatusSummaryContent = ({
  status,
  title,
  description
}: PaymentStatusSummaryContentProps) => {
  // Render appropriate icon based on status
  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />;
      case 'failed':
        return <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />;
      case 'cancelled':
        return <BanIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />;
      case 'paused':
        return <PauseCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />;
      case 'overdue':
        return <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />;
      default:
        return <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />;
    }
  };

  return (
    <div>
      {renderIcon()}
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default PaymentStatusSummaryContent;
