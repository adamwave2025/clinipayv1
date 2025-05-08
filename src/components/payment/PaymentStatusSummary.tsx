
import React from 'react';
import { Button } from '@/components/ui/button';
import PaymentStatusIcon from './PaymentStatusIcon';

interface PaymentStatusSummaryProps {
  status: 'success' | 'failed' | 'pending' | 'cancelled' | 'paused' | 'overdue';
  title: string;
  description: string;
  primaryActionLabel?: React.ReactNode;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

const PaymentStatusSummary = ({
  status,
  title,
  description,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
}: PaymentStatusSummaryProps) => {
  return (
    <div className="text-center">
      <PaymentStatusIcon status={status} />
      
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">
        {description}
      </p>
      
      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="space-y-3">
          {primaryActionLabel && (
            <Button 
              className="w-full bg-gradient-primary text-white hover:opacity-90" 
              onClick={onPrimaryAction}
            >
              {primaryActionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentStatusSummary;
