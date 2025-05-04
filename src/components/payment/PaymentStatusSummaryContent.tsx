
import React from 'react';
import { CheckCircle, AlertTriangle, Clock, AlertCircle } from 'lucide-react';

interface PaymentStatusSummaryContentProps {
  status: 'success' | 'pending' | 'failed' | 'cancelled' | 'overdue' | 'paused';
  title: string;
  description: string;
}

const PaymentStatusSummaryContent = ({ 
  status, 
  title, 
  description 
}: PaymentStatusSummaryContentProps) => {
  // Define icon and color based on status
  let icon;
  let iconClassName;
  
  switch (status) {
    case 'success':
      icon = <CheckCircle className="w-12 h-12 text-green-500" />;
      iconClassName = "bg-green-100";
      break;
    case 'pending':
      icon = <Clock className="w-12 h-12 text-amber-500" />;
      iconClassName = "bg-amber-100";
      break;
    case 'failed':
      icon = <AlertTriangle className="w-12 h-12 text-red-500" />;
      iconClassName = "bg-red-100";
      break;
    case 'cancelled':
      icon = <AlertCircle className="w-12 h-12 text-gray-500" />;
      iconClassName = "bg-gray-100";
      break;
    case 'overdue':
      icon = <AlertTriangle className="w-12 h-12 text-red-500" />;
      iconClassName = "bg-red-100";
      break;
    case 'paused':
      icon = <Clock className="w-12 h-12 text-blue-500" />;
      iconClassName = "bg-blue-100";
      break;
    default:
      icon = <Clock className="w-12 h-12 text-amber-500" />;
      iconClassName = "bg-amber-100";
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className={`${iconClassName} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default PaymentStatusSummaryContent;
