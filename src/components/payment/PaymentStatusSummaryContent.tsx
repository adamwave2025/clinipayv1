
import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Pause, Ban, Calendar } from 'lucide-react';

type Status = 'success' | 'cancelled' | 'paused' | 'overdue' | 'pending' | 'rescheduled';

interface PaymentStatusSummaryContentProps {
  status: Status;
  title: string;
  description: string;
}

const PaymentStatusSummaryContent: React.FC<PaymentStatusSummaryContentProps> = ({
  status,
  title,
  description
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />;
      case 'cancelled':
        return <Ban className="h-12 w-12 text-amber-600 mx-auto mb-2" />;
      case 'paused':
        return <Pause className="h-12 w-12 text-blue-600 mx-auto mb-2" />;
      case 'overdue':
        return <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-gray-600 mx-auto mb-2" />;
      case 'rescheduled':
        return <Calendar className="h-12 w-12 text-amber-600 mx-auto mb-2" />;
      default:
        return <Clock className="h-12 w-12 text-gray-600 mx-auto mb-2" />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'cancelled':
        return 'text-amber-600';
      case 'paused':
        return 'text-blue-600';
      case 'overdue':
        return 'text-red-600';
      case 'pending':
        return 'text-gray-600';
      case 'rescheduled':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="text-center">
      {getStatusIcon()}
      <h3 className={`text-xl font-semibold ${getStatusClass()} mb-2`}>{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default PaymentStatusSummaryContent;
