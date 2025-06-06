
import React, { useEffect, useRef, useState } from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface StripeCardElementProps {
  onChange?: (event: any) => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
}

// Create a stable version of the card element that resists re-renders
const StripeCardElement = ({ 
  onChange, 
  isLoading = false, 
  label = "Card Details",
  className = ""
}: StripeCardElementProps) => {
  // Store card state
  const cardStateRef = useRef<{
    empty: boolean;
    complete: boolean;
    error?: { message: string } | null;
  }>({ empty: true, complete: false });
  
  // Keep track of whether the card has been mounted
  const hasBeenMounted = useRef(false);
  const [mounted, setMounted] = useState(false);
  
  // Store the latest onChange callback
  const onChangeRef = useRef(onChange);
  
  // Update the ref when the onChange prop changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Set mounted flag after component is rendered
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

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

  // Enhanced change handler to provide better tracking
  const handleCardChange = (event: any) => {
    // Store the latest card state
    cardStateRef.current = {
      empty: event.empty,
      complete: event.complete,
      error: event.error
    };

    // Enhanced logging
    console.log('Card element change:', { 
      isEmpty: event.empty, 
      isComplete: event.complete, 
      hasError: event.error ? true : false,
      errorMessage: event.error?.message || 'No error',
      hasBeenMounted: hasBeenMounted.current,
      mountedState: mounted
    });
    
    // Call parent onChange if it exists
    if (onChangeRef.current) {
      onChangeRef.current(event);
    }

    // Mark as mounted after first change
    if (!hasBeenMounted.current) {
      hasBeenMounted.current = true;
    }
  };

  return (
    <FormItem className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <div 
        className={`mt-1 p-3 border rounded-md ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        aria-disabled={isLoading}
        data-testid="stripe-card-element-container"
      >
        <FormControl>
          <CardElement 
            id="card-element"
            options={cardElementOptions} 
            onChange={handleCardChange} 
            // We don't use disabled since it's not supported by Stripe
            // Instead we control via parent div's classes and aria-disabled
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  );
};

export default React.memo(StripeCardElement);
