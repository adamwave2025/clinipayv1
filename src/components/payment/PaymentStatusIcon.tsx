
import React from 'react';
import { CheckCircle2, X, AlertTriangle, BanIcon, PauseCircle, Clock } from 'lucide-react';

interface PaymentStatusIconProps {
  status: 'success' | 'failed' | 'pending' | 'cancelled' | 'paused' | 'overdue';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PaymentStatusIcon = ({ 
  status, 
  size = 'md', 
  className = '' 
}: PaymentStatusIconProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };
  
  const iconSize = sizeClasses[size];
  
  const statusConfig = {
    success: {
      icon: <CheckCircle2 className={`${iconSize} text-green-600 ${className}`} />,
      bgColor: 'bg-green-100'
    },
    failed: {
      icon: <X className={`${iconSize} text-red-600 ${className}`} />,
      bgColor: 'bg-red-100'
    },
    pending: {
      icon: <Clock className={`${iconSize} text-amber-600 ${className}`} />,
      bgColor: 'bg-amber-100'
    },
    cancelled: {
      icon: <BanIcon className={`${iconSize} text-amber-600 ${className}`} />,
      bgColor: 'bg-amber-100'
    },
    paused: {
      icon: <PauseCircle className={`${iconSize} text-blue-600 ${className}`} />,
      bgColor: 'bg-blue-100'
    },
    overdue: {
      icon: <AlertTriangle className={`${iconSize} text-amber-600 ${className}`} />,
      bgColor: 'bg-amber-100'
    }
  };

  const { icon, bgColor } = statusConfig[status];

  return (
    <div className={`inline-flex items-center justify-center rounded-full ${bgColor} p-6 mb-6`}>
      {icon}
    </div>
  );
};

export default PaymentStatusIcon;
