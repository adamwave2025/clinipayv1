
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Utility function to set up the notification processing cron job.
 * This can be called from the admin panel or during app initialization.
 */
export async function setupNotificationCron() {
  try {
    // Call the edge function to set up the cron job
    const { data, error } = await supabase.functions.invoke('setup-notification-cron');
    
    if (error) {
      console.error('Error setting up notification cron:', error);
      toast.error('Failed to set up notification processing: ' + error.message);
      return { success: false, error };
    }
    
    console.log('Notification cron setup result:', data);
    toast.success('Notification processing has been set up successfully');
    return { success: true, data };
  } catch (err: any) {
    console.error('Exception setting up notification cron:', err);
    toast.error('Failed to set up notification processing: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Process any pending notifications in the queue immediately.
 * This can be useful after adding a new notification to ensure quick delivery.
 */
export async function processNotificationsNow() {
  try {
    // Call the edge function to process notifications
    const { data, error } = await supabase.functions.invoke('process-notification-queue');
    
    if (error) {
      console.error('Error processing notifications:', error);
      return { success: false, error };
    }
    
    console.log('Notification processing result:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('Exception processing notifications:', err);
    return { success: false, error: err.message };
  }
}
