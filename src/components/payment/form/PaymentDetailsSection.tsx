
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import { PaymentFormValues } from './FormSchema';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ control, isLoading }: PaymentDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">Payment Details</h3>
      
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
    </div>
  );
};

export default PaymentDetailsSection;
