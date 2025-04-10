
import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PaymentFormValues } from './FormSchema';

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
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Information</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input 
                    placeholder="Card Number" 
                    {...field}
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      // Set cardComplete to true when a value is entered
                      // This is a simplified approach compared to using Stripe Elements
                      if (e.target.value) {
                        setValue('cardComplete', true);
                      } else {
                        setValue('cardComplete', false);
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField
            control={control}
            name="cardExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input
                    placeholder="MM/YY"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="cardCvc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CVC</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsSection;
