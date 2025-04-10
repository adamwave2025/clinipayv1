
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PaymentFormValues } from './FormSchema';

interface SimplePaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const SimplePaymentDetailsSection = ({ control, isLoading }: SimplePaymentDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Details</h3>
      
      <div className="border rounded-md p-4">
        <FormField
          control={control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="4242 4242 4242 4242"
                  disabled={isLoading}
                  {...field}
                />
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

export default SimplePaymentDetailsSection;
