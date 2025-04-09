
import React from 'react';
import { Control, UseFormSetValue } from 'react-hook-form';
import { CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PaymentFormValues } from './FormSchema';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  setValue: UseFormSetValue<PaymentFormValues>;
  isLoading: boolean;
}

const PaymentDetailsSection = ({ control, setValue, isLoading }: PaymentDetailsSectionProps) => {
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    setValue('cardNumber', formatted, { shouldValidate: true });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\//g, '');
    let formatted = value;
    
    if (value.length > 2) {
      formatted = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    setValue('cardExpiry', formatted, { shouldValidate: true });
  };

  return (
    <div className="pt-4 border-t space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Payment Details</h2>
        <CreditCard className="h-5 w-5 text-gray-400" />
      </div>
      
      <FormField
        control={control}
        name="cardNumber"
        render={({ field: { onChange, ...fieldProps } }) => (
          <FormItem>
            <FormLabel>Card Number</FormLabel>
            <FormControl>
              <Input
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                disabled={isLoading}
                onChange={handleCardNumberChange}
                {...fieldProps}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="cardExpiry"
          render={({ field: { onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Expiry Date</FormLabel>
              <FormControl>
                <Input
                  placeholder="MM/YY"
                  maxLength={5}
                  disabled={isLoading}
                  onChange={handleExpiryChange}
                  {...fieldProps}
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
                  maxLength={4}
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
  );
};

export default PaymentDetailsSection;
