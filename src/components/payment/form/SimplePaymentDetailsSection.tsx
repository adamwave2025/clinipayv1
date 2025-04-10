
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
        <p className="text-sm text-gray-500 mb-4">
          This component has been replaced with the Stripe Card Element for PCI compliance.
          Please use the StripeCardElement component instead.
        </p>
        
        <FormField
          control={control}
          name="stripeCard"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Information</FormLabel>
              <FormControl>
                <Input
                  disabled={true}
                  placeholder="This field is for demo purposes only"
                  className="font-mono bg-gray-100"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-amber-600 mt-1">
                For real card processing, use the Stripe Card Element
              </p>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default SimplePaymentDetailsSection;
