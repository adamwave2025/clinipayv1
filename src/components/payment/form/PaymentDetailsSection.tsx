
import React from 'react';
import { Control } from 'react-hook-form';
import { PaymentFormValues } from './FormSchema';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import ApplePayButton from './ApplePayButton';
import { debugCurrencyInfo } from '@/services/CurrencyService';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
  amount: number; // Amount in pence
  onApplePaySuccess?: (paymentMethod: any) => void;
  onCardElementChange?: (event: any) => void;
}

const PaymentDetailsSection = ({ 
  control, 
  isLoading,
  amount,
  onApplePaySuccess,
  onCardElementChange
}: PaymentDetailsSectionProps) => {
  // Enhanced logging to debug amount issues
  debugCurrencyInfo(amount, 'PaymentDetailsSection input amount', true);
  
  // Default to 100p (£1) if no amount is available to prevent zero-amount payments
  const safeAmount = amount > 0 ? amount : 100;
  
  // Convert from pence to pounds for Apple Pay
  const amountInPounds = safeAmount / 100;
  console.log('PaymentDetailsSection: Amount in pounds for display:', amountInPounds);
  
  return (
    <div className="space-y-4">
      <div className="text-lg font-medium">Payment Details</div>
      
      <FormField
        control={control}
        name="stripeCard"
        render={({ field }) => (
          <StripeCardElement 
            isLoading={isLoading} 
            onChange={(e) => {
              if (onCardElementChange) {
                onCardElementChange(e);
              }
              field.onChange(e.complete ? e : { empty: true });
            }}
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
      
      <div className="text-xs text-gray-500 mt-2">
        Your payment is secure and encrypted. We never store your full card details.
      </div>
    </div>
  );
};

export default PaymentDetailsSection;
