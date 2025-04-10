
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
import StripeCardElement from './StripeCardElement';

interface PaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
  onCardChange?: (complete: boolean) => void;
}

const PaymentDetailsSection = ({ 
  control, 
  isLoading,
  onCardChange
}: PaymentDetailsSectionProps) => {
  // Monitor card completion status
  const handleCardChange = (event: any) => {
    if (onCardChange) {
      onCardChange(event.complete);
    }
  };

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
        <div className="border rounded-md p-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <StripeCardElement 
            onChange={handleCardChange}
            isLoading={isLoading}
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
