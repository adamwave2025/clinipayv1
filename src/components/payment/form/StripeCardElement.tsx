
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
      },
      invalid: {
        color: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  const handleCardChange = (event: any) => {
    // Log card validation status to help with debugging
    console.log('Card element change:', { 
      isEmpty: event.empty, 
      isComplete: event.complete, 
      hasError: event.error ? true : false,
      errorMessage: event.error?.message || 'No error'
    });
    
    // Forward the event to parent component
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className={`mt-1 p-3 border rounded-md ${isLoading ? 'opacity-50' : ''}`}>
        <FormControl>
          <CardElement 
            options={cardElementOptions} 
            onChange={handleCardChange} 
            id="card-element"
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  );
};

export default StripeCardElement;
