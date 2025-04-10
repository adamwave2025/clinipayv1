
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
import { Input } from '@/components/ui/input';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ 
  control, 
  isLoading
}: PaymentDetailsSectionProps) => {
  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-lg font-medium">Payment Details</h2>
      
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name on Card</FormLabel>
            <FormControl>
              <Input
                placeholder="Name as shown on card"
                disabled={isLoading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="space-y-2">
        <FormLabel className="text-sm font-medium">Card Details</FormLabel>
        <div className="border rounded-md p-3">
          <FormField
            control={control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    disabled={isLoading}
                    maxLength={19}
                    className="font-mono"
                    {...field}
                    onChange={(e) => {
                      // Format card number with spaces
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
                      placeholder="MM/YY"
                      disabled={isLoading}
                      maxLength={5}
                      className="font-mono"
                      {...field}
                      onChange={(e) => {
                        // Format expiry date as MM/YY
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
                      placeholder="123"
                      disabled={isLoading}
                      maxLength={4}
                      className="font-mono"
                      {...field}
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
        <p className="text-xs text-gray-500">
          Your card details are secured with 256-bit encryption.
        </p>
      </div>
    </div>
  );
};

export default PaymentDetailsSection;
