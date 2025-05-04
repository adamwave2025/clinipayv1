
import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface StripeCardElementProps {
  onChange?: (event: any) => void;
  isLoading?: boolean;
  label?: string;
}

const StripeCardElement = ({ onChange, isLoading = false, label = "Card Details" }: StripeCardElementProps) => {
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#9b87f5',
        lineHeight: '40px',
      },
      invalid: {
        color: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <FormItem>
      <FormLabel className="text-base font-medium">{label}</FormLabel>
      <div className={`mt-2 p-4 border rounded-md ${isLoading ? 'opacity-50' : ''} bg-white h-[72px] flex items-center`}>
        <FormControl>
          <CardElement 
            options={cardElementOptions} 
            onChange={onChange} 
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  );
};

export default StripeCardElement;
