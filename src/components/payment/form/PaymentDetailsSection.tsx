
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import { PaymentFormValues } from './FormSchema';
import PaymentSectionContainer from '../PaymentSectionContainer';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ control, isLoading }: PaymentDetailsSectionProps) => {
  return (
    <PaymentSectionContainer title="Payment Details">
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
