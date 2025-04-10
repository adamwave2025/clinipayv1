
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/integrations/supabase/client';

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
