
import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

interface StripeCardElementProps {
  onChange?: (event: any) => void;
  isLoading?: boolean;
}

const StripeCardElement = ({ onChange, isLoading = false }: StripeCardElementProps) => {
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="stripe-card-element">
      <CardElement 
        options={cardElementOptions} 
        onChange={onChange} 
        disabled={isLoading}
      />
    </div>
  );
};

export default StripeCardElement;
