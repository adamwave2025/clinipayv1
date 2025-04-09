
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { supabase } from '@/integrations/supabase/client';

// Setup auth trigger to ensure proper configuration
const setupAuthTrigger = async () => {
  try {
    console.log("Setting up auth trigger...");
    const { error } = await supabase.functions.invoke('setup-auth-trigger');
    if (error) {
      console.error("Error setting up auth trigger:", error);
    } else {
      console.log("Auth trigger setup completed");
    }
  } catch (err) {
    console.error("Failed to setup auth trigger:", err);
  }
};

// Run the setup function
setupAuthTrigger();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
