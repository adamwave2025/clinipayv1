
import React from 'react';
import { Control } from 'react-hook-form';
import { PaymentFormValues } from './FormSchema';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import ApplePayButton from './ApplePayButton';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
  onApplePaySuccess?: (paymentMethod: any) => void;
  onCardElementChange?: (event: any) => void;
}

const PaymentDetailsSection = ({ 
  control, 
  isLoading,
  onApplePaySuccess,
  onCardElementChange
}: PaymentDetailsSectionProps) => {
  // Get the payment amount from the link data
  // Note: We're passing null as linkId since we're using the hook in a different context
  // where we expect the link data to be already available in context/state
  const { linkData } = usePaymentLinkData(null);
  
  // Default to 0 if no amount is available
  const amount = linkData?.amount ? linkData.amount / 100 : 0; // Convert from pence to pounds
  
  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">Payment Details</div>
      
      <FormField
        control={control}
        name="stripeCard"
        render={() => (
          <StripeCardElement 
            isLoading={isLoading} 
            onChange={onCardElementChange}
          />
        )}
      />
      
      {onApplePaySuccess && (
        <div className="mt-4">
          <ApplePayButton 
            onApplePaySuccess={onApplePaySuccess}
            isLoading={isLoading}
            amount={amount}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentDetailsSection;
