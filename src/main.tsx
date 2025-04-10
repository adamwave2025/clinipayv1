
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Make environment variables available globally
// This ensures they're accessible throughout the application
window.ENV = {
  PUBLISHABLE_KEY: import.meta.env.PUBLISHABLE_KEY || '',
  SUPABASE_URL: import.meta.env.SUPABASE_URL || '',
};

// Log available environment variables for debugging
console.log('Environment variables available:', {
  PUBLISHABLE_KEY: !!window.ENV.PUBLISHABLE_KEY,
  SUPABASE_URL: !!window.ENV.SUPABASE_URL
});

// Initialize the auth trigger setup
const setupAuthTrigger = async () => {
  try {
    console.log('Setting up auth trigger...');
    const response = await supabase.functions.invoke('setup-auth-trigger');
    console.log('Auth trigger setup response:', response);
    
    if (response.error) {
      console.error('Error setting up auth trigger:', response.error);
      // Don't show toasts for auth trigger setup errors to users
      // These are backend issues that users don't need to know about
    } else {
      console.log('Auth trigger setup successful');
    }
  } catch (error) {
    console.error('Error setting up auth trigger:', error);
    // Similarly, don't show errors to users for backend setup issues
  }
};

// Run setup on app initialization but don't block rendering
setupAuthTrigger();

createRoot(document.getElementById("root")!).render(<App />);
