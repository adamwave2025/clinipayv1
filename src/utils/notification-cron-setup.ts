
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
