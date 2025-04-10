
import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

interface StripeProviderProps {
  children: React.ReactNode;
}

const StripeProvider = ({ children }: StripeProviderProps) => {
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    // Get the Stripe publishable key from window.ENV
    const publishableKey = window.ENV?.PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Missing Stripe publishable key');
      toast.error('Payment system configuration error');
      return;
    }
    
    // Initialize Stripe with the publishable key
    try {
      const promise = loadStripe(publishableKey);
      setStripePromise(promise);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      toast.error('Failed to initialize payment system');
    }
  }, []);
  
  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading payment system...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
