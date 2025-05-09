
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import { PaymentFormValues } from './FormSchema';
import PaymentSectionContainer from '../PaymentSectionContainer';
import ApplePayButton from './ApplePayButton';
import { usePaymentLinkData } from '../../hooks/usePaymentLinkData';
import { useParams } from 'react-router-dom';
import { penceToPounds, debugCurrencyInfo } from '../../services/CurrencyService';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
  onApplePaySuccess?: (paymentMethod: any) => void;
}

const PaymentDetailsSection = ({ 
  control, 
  isLoading, 
  onApplePaySuccess 
}: PaymentDetailsSectionProps) => {
  const { linkId } = useParams<{ linkId: string }>();
  const { linkData } = usePaymentLinkData(linkId);
  
  // Default to 100p (£1) if no amount is available to prevent zero-amount payments
  const amount = linkData?.amount || 0;
  
  // Detailed logging for debugging
  console.log('--- Payment Details Section Debug ---');
  console.log('Raw amount from linkData (pence):', amount);
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

  const handleApplePaySuccess = (paymentMethod: any) => {
    if (onApplePaySuccess) {
      onApplePaySuccess(paymentMethod);
    }
  };

  return (
    <PaymentSectionContainer title="Payment Details">
      {/* Apple Pay Button - only shows on iOS devices with Apple Pay capability */}
      {onApplePaySuccess && amountInPounds > 0 && (
        <ApplePayButton 
          amount={amountInPounds}
          isLoading={isLoading}
          onApplePaySuccess={handleApplePaySuccess}
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
