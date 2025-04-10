
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PaymentFormValues } from './FormSchema';

interface SimplePaymentDetailsSectionProps {
  control: Control<PaymentFormValues>;
  isLoading: boolean;
}

// This is a simplified version without Stripe integration
// NOTE: This component exists for reference only and is not currently used in the application
const SimplePaymentDetailsSection = ({ control, isLoading }: SimplePaymentDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Details</h3>
      
      <div className="border rounded-md p-4">
        <FormItem>
          <FormLabel>Card Information</FormLabel>
          <FormControl>
            <Input
              placeholder="Please use the Stripe integration for secure payments"
              disabled={true}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormItem>
            <FormLabel>Expiry Date</FormLabel>
            <FormControl>
              <Input
                placeholder="MM/YY"
                disabled={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          
          <FormItem>
            <FormLabel>CVC</FormLabel>
            <FormControl>
              <Input
                placeholder="123"
                disabled={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>
      </div>
    </div>
  );
};

export default SimplePaymentDetailsSection;
