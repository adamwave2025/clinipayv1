
import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface StripeProviderProps {
  children: React.ReactNode;
}

const StripeProvider = ({ children }: StripeProviderProps) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublishableKey = async () => {
      try {
        // Fetch the publishable key from our edge function
        const { data, error } = await supabase.functions.invoke('get-stripe-public-key');
        
        if (error || !data?.publishableKey) {
          console.error('Error fetching Stripe publishable key:', error || 'No key returned');
          toast.error('Failed to initialize payment system');
          setLoading(false);
          return;
        }
        
        // Initialize Stripe with the publishable key
        const promise = loadStripe(data.publishableKey);
        setStripePromise(promise);
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        toast.error('Failed to initialize payment system');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPublishableKey();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
        <p className="ml-3 text-gray-500">Loading payment system...</p>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-500">Payment system could not be initialized. Please try again later.</p>
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
