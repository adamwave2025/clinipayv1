
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
                  {...field}
                  disabled={isLoading}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="font-mono"
                  onChange={(e) => {
                    // Format the card number with spaces after every 4 digits
                    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
                    field.onChange(formattedValue);
                  }}
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
                    {...field}
                    disabled={isLoading}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="font-mono"
                    onChange={(e) => {
                      // Format the expiry date as MM/YY
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 2) {
                        field.onChange(value);
                      } else {
                        field.onChange(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
                      }
                    }}
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
                    {...field}
                    disabled={isLoading}
                    placeholder="123"
                    maxLength={4}
                    className="font-mono"
                    onChange={(e) => {
                      // Allow only numbers for CVC
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
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
