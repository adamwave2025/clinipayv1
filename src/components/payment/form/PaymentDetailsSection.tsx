
import React from 'react';
import { Control } from 'react-hook-form';
import { PaymentFormValues } from './FormSchema';
import { FormField } from '@/components/ui/form';
import StripeCardElement from './StripeCardElement';
import ApplePayButton from './ApplePayButton';

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
            onSuccess={onApplePaySuccess}
            isDisabled={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentDetailsSection;
