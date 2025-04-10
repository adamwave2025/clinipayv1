
import React, { useEffect } from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PaymentFormValues } from './FormSchema';
import { CardElement } from '@stripe/react-stripe-js';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  setValue: UseFormSetValue<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ control, setValue, isLoading }: PaymentDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Details</h3>
      
      <div className="border rounded-md p-4">
        <FormField
          control={control}
          name="cardElement"
          render={({ field }) => (
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
                    }}
                    onChange={(e) => {
                      setValue('cardComplete', e.complete);
                    }}
                    disabled={isLoading}
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

export default PaymentDetailsSection;
