
import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { CardElement } from '@stripe/react-stripe-js';
import { PaymentFormValues } from './FormSchema';

interface StripeCardSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
  setValue: UseFormSetValue<PaymentFormValues>;
}

const StripeCardSection = ({ control, isLoading, setValue }: StripeCardSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Details</h3>
      <div className="border rounded-md p-4">
        <FormField
          control={control}
          name="cardComplete"
          render={() => (
            <FormItem>
              <FormLabel>Card Information</FormLabel>
              <FormControl>
                <div className="border rounded-md p-3 bg-white">
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                      disabled: isLoading,
                    }}
                    onChange={(e) => {
                      setValue('cardComplete', e.complete);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default StripeCardSection;
