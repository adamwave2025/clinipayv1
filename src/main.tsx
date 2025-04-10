
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Simple environment initialization to avoid errors
if (typeof window !== 'undefined') {
  // Try to fetch the Stripe publishable key from the Supabase function
  const fetchPublishableKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-public-key');
      
      if (error) {
        console.error('Error fetching publishable key:', error);
        return;
      }
      
      if (data && data.publishableKey) {
        window.ENV = {
          ...(window.ENV || {}),
          PUBLISHABLE_KEY: data.publishableKey,
          SUPABASE_URL: import.meta.env.SUPABASE_URL || '',
        };
        console.log('Stripe publishable key loaded');
      }
    } catch (error) {
      console.error('Failed to fetch publishable key:', error);
    }
  };
  
  // Initialize with default values first
  window.ENV = {
    PUBLISHABLE_KEY: '',
    SUPABASE_URL: import.meta.env.SUPABASE_URL || '',
  };
  
  // Then try to fetch the actual key
  fetchPublishableKey();
}

// Initialize the auth trigger setup
const setupAuthTrigger = async () => {
  try {
    console.log('Setting up auth trigger...');
    const response = await supabase.functions.invoke('setup-auth-trigger');
    console.log('Auth trigger setup response:', response);
    
    if (response.error) {
      console.error('Error setting up auth trigger:', response.error);
    } else {
      console.log('Auth trigger setup successful');
    }
  } catch (error) {
    console.error('Error setting up auth trigger:', error);
  }
};

// Run setup on app initialization but don't block rendering
setupAuthTrigger();

createRoot(document.getElementById("root")!).render(<App />);
