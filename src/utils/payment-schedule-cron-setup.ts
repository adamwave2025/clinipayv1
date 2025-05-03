
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Set up the cron job to process payment schedules
 * This can be called from the admin panel or during app initialization
 */
export async function setupPaymentScheduleCron() {
  try {
    console.log('Setting up payment schedule cron job...');
    
    // Call the edge function to set up the cron job
    const { data, error } = await supabase.functions.invoke('setup-payment-schedule-cron');
    
    if (error) {
      console.error('Error setting up payment schedule cron:', error);
      return { success: false, error };
    }
    
    console.log('Payment schedule cron setup result:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('Exception setting up payment schedule cron:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Process any pending payment schedules immediately
 * This can be useful when creating a new payment plan to test it immediately
 */
export async function processPaymentScheduleNow() {
  try {
    console.log('Processing payment schedules immediately...');
    
    // Call the edge function to process payment schedules
    const { data, error } = await supabase.functions.invoke('process-payment-schedule');
    
    if (error) {
      console.error('Error processing payment schedules:', error);
      toast.error('Failed to process payment schedules: ' + error.message);
      return { success: false, error };
    }
    
    console.log('Payment schedule processing result:', data);
    toast.success('Payment schedules processed successfully');
    return { success: true, data };
  } catch (err: any) {
    console.error('Exception processing payment schedules:', err);
    toast.error('Failed to process payment schedules: ' + err.message);
    return { success: false, error: err.message };
  }
}
