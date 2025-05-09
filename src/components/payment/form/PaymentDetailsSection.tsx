
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
  
  // Enhanced logging to debug amount issues
  console.log('PaymentDetailsSection: Raw link data amount:', linkData?.amount);
  
  // Default to 0 if no amount is available
  // IMPORTANT: linkData.amount is already in pence, we convert to pounds for display
  const amountInPounds = linkData?.amount ? linkData.amount / 100 : 0; // Convert from pence to pounds
  console.log('PaymentDetailsSection: Converted amount in pounds:', amountInPounds);
  
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
      
      {onApplePaySuccess && amountInPounds > 0 && (
        <div className="mt-4">
          <ApplePayButton 
            onApplePaySuccess={onApplePaySuccess}
            isLoading={isLoading}
            amount={amountInPounds}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentDetailsSection;
