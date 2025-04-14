
import React, { useState } from 'react';
import { Control } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import { PaymentFormValues } from './FormSchema';
import PaymentSectionContainer from '../PaymentSectionContainer';
import ApplePayButton from './ApplePayButton';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import { useParams } from 'react-router-dom';

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
  const amount = linkData?.amount || 0;

  const handleApplePaySuccess = (paymentMethod: any) => {
    if (onApplePaySuccess) {
      onApplePaySuccess(paymentMethod);
    }
  };

  return (
    <PaymentSectionContainer title="Payment Details">
      {/* Apple Pay Button - only shows on iOS devices with Apple Pay capability */}
      {onApplePaySuccess && (
        <ApplePayButton 
          amount={amount}
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
