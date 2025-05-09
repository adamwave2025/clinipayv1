
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import { PaymentFormValues } from './FormSchema';
import PaymentSectionContainer from '../PaymentSectionContainer';
import ApplePayButton from './ApplePayButton';
import { penceToPounds, debugCurrencyInfo } from '../../services/CurrencyService';

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
  // Detailed logging for debugging
  console.log('--- Payment Details Section Debug ---');
  console.log('Raw amount from props (pence):', amount);
  debugCurrencyInfo(amount, 'PaymentDetailsSection', true);
  
  // Use a safe amount to prevent issues - minimum £1 (100p)
  const safeAmount = amount > 0 ? amount : 100;
  
  // Convert amount from pence to pounds for Apple Pay
  const amountInPounds = penceToPounds(safeAmount);
  console.log('Converted amount for Apple Pay (pounds):', amountInPounds);
  
  // Additional validation
  if (amount <= 0) {
    console.warn('Warning: Payment amount is zero or negative:', amount);
  }

  return (
    <PaymentSectionContainer title="Payment Details">
      {/* Apple Pay Button - only shows on iOS devices with Apple Pay capability */}
      {onApplePaySuccess && amountInPounds > 0 && (
        <ApplePayButton 
          amount={amountInPounds}
          isLoading={isLoading}
          onApplePaySuccess={onApplePaySuccess}
        />
      )}
      
      {/* Regular credit card input field */}
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
      
      <div className="text-xs text-gray-500 mt-2">
        Your payment is secure and encrypted. We never store your full card details.
      </div>
    </PaymentSectionContainer>
  );
};

export default PaymentDetailsSection;
