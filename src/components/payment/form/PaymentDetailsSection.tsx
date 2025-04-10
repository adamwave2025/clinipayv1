
import React from 'react';
import { Control } from 'react-hook-form';
import { PaymentFormValues } from './FormSchema';
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import StripeCardElement from './StripeCardElement';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ 
  control, 
  isLoading
}: PaymentDetailsSectionProps) => {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-lg font-medium">Payment Details</h2>
      
      <div className="space-y-2">
        <FormLabel className="text-sm font-medium">Card Details</FormLabel>
        <div className="border rounded-md p-4">
          <FormField
            control={control}
            name="stripeCard"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <StripeCardElement 
                    isLoading={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-xs text-gray-500">
          Your card details are secured with 256-bit encryption.
        </p>
      </div>
    </div>
  );
};

export default PaymentDetailsSection;
