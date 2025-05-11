
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to set up the auth trigger with improved error handling and retry
 */
export function useAuthTrigger() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Setup auth trigger on initialization
    const setupAuthTrigger = async () => {
      try {
        console.log(`Setting up auth trigger (attempt ${retries + 1})`);
        
        const { data, error } = await supabase.functions.invoke('setup-auth-trigger');
        
        if (error) {
          console.error('Error setting up auth trigger:', error);
          setSetupError(error.message);
          
          if (retries < MAX_RETRIES) {
            // Implement exponential backoff for retries
            const retryDelay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
            console.log(`Retrying auth trigger setup in ${retryDelay}ms...`);
            
            setTimeout(() => {
              setRetries(prev => prev + 1);
            }, retryDelay);
          } else {
            // After max retries, show a visible error notification
            toast.error('Failed to set up authentication system. Please refresh the page or contact support if the problem persists.');
          }
        } else {
          console.log('Auth trigger setup complete:', data);
          setIsSetupComplete(true);
          setSetupError(null);
        }
      } catch (error: any) {
        console.error('Failed to set up auth trigger:', error);
        setSetupError(error.message || 'Unknown error');
        
        if (retries < MAX_RETRIES) {
          // Implement exponential backoff for retries
          const retryDelay = Math.pow(2, retries) * 1000;
          console.log(`Retrying auth trigger setup in ${retryDelay}ms...`);
          
          setTimeout(() => {
            setRetries(prev => prev + 1);
          }, retryDelay);
        } else {
          toast.error('Failed to set up authentication system. Please refresh the page or contact support if the problem persists.');
        }
      }
    };
    
    // Only attempt setup if we haven't completed it yet and haven't exceeded max retries
    if (!isSetupComplete && retries <= MAX_RETRIES) {
      setupAuthTrigger();
    }
  }, [isSetupComplete, retries]);

  return {
    isSetupComplete,
    setupError,
    retries
  };
}
