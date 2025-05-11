
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/integrations/supabase/client';
import { setupPaymentScheduleCron } from './utils/payment-schedule-cron-setup';
import { toast } from 'sonner';

// Initialize the auth trigger setup with better error handling
const setupAuthTrigger = async () => {
  try {
    console.log('Setting up auth trigger from main.tsx...');
    const response = await supabase.functions.invoke('setup-auth-trigger');
    console.log('Auth trigger setup response:', response);
    
    if (response.error) {
      console.error('Error setting up auth trigger:', response.error);
      // We don't show errors here as the useAuthTrigger hook will handle retries and notifications
    } else {
      console.log('Auth trigger setup successful');
    }
  } catch (error) {
    console.error('Error setting up auth trigger:', error);
  }
};

// Initialize the payment schedule cron
const initializePaymentScheduleCron = async () => {
  try {
    console.log('Initializing payment schedule cron...');
    const result = await setupPaymentScheduleCron();
    console.log('Payment schedule cron initialization result:', result);
  } catch (error) {
    console.error('Error initializing payment schedule cron:', error);
  }
};

// Initialize the plan status update cron
const initializePlanStatusCron = async () => {
  try {
    console.log('Initializing plan status update cron...');
    const response = await supabase.functions.invoke('setup-plan-status-cron');
    console.log('Plan status update cron initialization result:', response);
    
    if (response.error) {
      console.error('Error setting up plan status update cron:', response.error);
    } else {
      console.log('Plan status update cron setup successful');
    }
  } catch (error) {
    console.error('Error initializing plan status update cron:', error);
  }
};

// Run setup on app initialization but don't block rendering
// We use a small timeout to ensure these are not competing for resources during initial load
setTimeout(() => {
  setupAuthTrigger();
}, 100);

setTimeout(() => {
  initializePaymentScheduleCron();
}, 300);

setTimeout(() => {
  initializePlanStatusCron();
}, 500);

createRoot(document.getElementById("root")!).render(<App />);
