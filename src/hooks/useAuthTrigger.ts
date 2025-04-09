
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to set up the auth trigger
 */
export function useAuthTrigger() {
  useEffect(() => {
    // Setup auth trigger on initialization
    const setupAuthTrigger = async () => {
      try {
        const { error } = await supabase.functions.invoke('setup-auth-trigger');
        if (error) {
          console.error('Error setting up auth trigger:', error);
        } else {
          console.log('Auth trigger setup complete');
        }
      } catch (error) {
        console.error('Failed to set up auth trigger:', error);
      }
    };
    
    setupAuthTrigger();
  }, []);
}
