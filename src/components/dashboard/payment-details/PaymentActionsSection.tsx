
import React from 'react';
import { Button } from '@/components/ui/button';

interface PaymentActionsSectionProps {
  status: string;
  onRefund?: () => void;
  manualPayment?: boolean; // Add prop to indicate manual payment
}

const PaymentActionsSection = ({ 
  status, 
  onRefund,
  manualPayment = false // Default to false
}: PaymentActionsSectionProps) => {
  // Always hide refund button for manual payments or if status isn't paid or no handler
  if (status !== 'paid' || !onRefund || manualPayment === true) {
    console.log('Hiding refund button:', { 
      status, 
      hasOnRefund: !!onRefund, 
      manualPayment
    });
    return null;
  }
  
  console.log('Displaying refund button');
  return (
    <div className="flex justify-end mt-4">
      <Button 
        variant="outline" 
        onClick={onRefund}
        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        Issue Refund
      </Button>
    </div>
  );
};

export default PaymentActionsSection;
