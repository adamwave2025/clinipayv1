
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
  // Show refund button only for paid payments and only if a refund handler exists
  // Important: We're removing the restriction on manual payments to allow refunds for both types
  if (status !== 'paid' || !onRefund) {
    console.log('Hiding refund button:', { 
      status, 
      hasOnRefund: !!onRefund
    });
    return null;
  }
  
  console.log('Displaying refund button, payment type:', manualPayment ? 'manual' : 'online');
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
