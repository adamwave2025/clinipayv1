
import React from 'react';
import { Button } from '@/components/ui/button';

interface PaymentActionsSectionProps {
  status: string;
  onRefund?: () => void;
  manualPayment?: boolean;
}

const PaymentActionsSection = ({ 
  status, 
  onRefund,
  manualPayment = false
}: PaymentActionsSectionProps) => {
  // Show refund button for both regular and manual payments that are paid
  if (status !== 'paid' || !onRefund) {
    console.log('Hiding refund button:', { 
      status, 
      hasOnRefund: !!onRefund, 
      manualPayment
    });
    return null;
  }
  
  console.log('Displaying refund button for payment');
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
