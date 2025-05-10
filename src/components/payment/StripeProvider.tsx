
import React, { useEffect, useState, useRef } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const initAttempted = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPublishableKey = async () => {
      // Prevent multiple initialization attempts
      if (initAttempted.current) return;
      initAttempted.current = true;

      try {
        console.log('Fetching Stripe publishable key...'); 
        // Set a timeout to detect slow responses
        initTimeoutRef.current = setTimeout(() => {
          console.log('Stripe key fetch taking longer than expected...');
        }, 5000);
        
        // Fetch the publishable key from our edge function
        const { data, error: invokeError } = await supabase.functions.invoke('get-stripe-public-key');
        
        // Clear timeout
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        
        if (invokeError) {
          console.error('Error invoking function:', invokeError);
          setError(`Function error: ${invokeError.message || 'Unknown error'}`);
          toast.error('Failed to initialize payment system: Function error');
          setLoading(false);
          return;
        }
        
        if (!data) {
          console.error('No data returned from function');
          setError('No data returned from function');
          toast.error('Failed to initialize payment system: No data returned');
          setLoading(false);
          return;
        }
        
        if (!data.publishableKey) {
          console.error('No publishable key in response:', data);
          setError(`No publishable key in response: ${JSON.stringify(data)}`);
          toast.error('Failed to initialize payment system: Missing key');
          setLoading(false);
          return;
        }
        
        console.log('Stripe key received, initializing...'); 
        
        try {
          // Initialize Stripe with the publishable key
          const promise = loadStripe(data.publishableKey);
          console.log('Stripe initialization started');
          
          // Wait for the promise to resolve to catch any initialization errors
          promise.then(stripeInstance => {
            if (!stripeInstance) {
              throw new Error('Failed to initialize Stripe');
            }
            console.log('Stripe initialized successfully:', !!stripeInstance);
            setStripePromise(promise);
            setLoading(false);
          }).catch(stripeError => {
            console.error('Error resolving Stripe promise:', stripeError);
            setError(`Stripe initialization error: ${stripeError.message || 'Unknown error'}`);
            toast.error('Failed to initialize Stripe library');
            setLoading(false);
          });
        } catch (stripeError: any) {
          console.error('Error initializing Stripe:', stripeError);
          setError(`Stripe initialization error: ${stripeError.message || 'Unknown error'}`);
          toast.error('Failed to initialize Stripe library');
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Unexpected error in StripeProvider:', error);
        setError(`Unexpected error: ${error.message || 'Unknown error'}`);
        toast.error('Failed to initialize payment system');
        setLoading(false);
      }
    };
    
    fetchPublishableKey();
    
    // Clean up timeout on unmount
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
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
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-red-500 mb-2">Payment system could not be initialized.</p>
        {error && <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded font-mono">{error}</p>}
        <p className="text-sm text-gray-500 mt-2">Please try again later or contact support.</p>
      </div>
    );
  }

  // Use common options across all Elements
  const elementsOptions = {
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      },
    ],
    // Set locale to improve default UX
    locale: 'en',
    // Explicitly set appearance mode to ensure consistent styling
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
