
import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, PauseCircle, AlertTriangle } from 'lucide-react';

interface PaymentStatusIconProps {
  status: 'success' | 'failed' | 'pending' | 'cancelled' | 'paused' | 'overdue';
  className?: string;
}

const PaymentStatusIcon = ({ status, className = '' }: PaymentStatusIconProps) => {
  switch (status) {
    case 'success':
      return (
        <div className={`flex justify-center mb-4 ${className}`}>
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      );
    case 'failed':
      return (
        <div className={`flex justify-center mb-4 ${className}`}>
          <div className="rounded-full bg-red-100 p-3">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      );
    case 'pending':
      return (
        <div className={`flex justify-center mb-4 ${className}`}>
          <div className="rounded-full bg-blue-100 p-3">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      );
    case 'cancelled':
      return (
        <div className={`flex justify-center mb-4 ${className}`}>
          <div className="rounded-full bg-gray-100 p-3">
            <XCircle className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      );
    case 'paused':
      return (
        <div className={`flex justify-center mb-4 ${className}`}>
          <div className="rounded-full bg-amber-100 p-3">
            <PauseCircle className="h-8 w-8 text-amber-600" />
          </div>
        </div>
      );
    case 'overdue':
      return (
        <div className={`flex justify-center mb-4 ${className}`}>
          <div className="rounded-full bg-orange-100 p-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      );
    default:
      return (
        <div className={`flex justify-center mb-4 ${className}`}>
          <div className="rounded-full bg-gray-100 p-3">
            <AlertCircle className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      );
  }
};

export default PaymentStatusIcon;
