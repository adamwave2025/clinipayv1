
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility function to set up the notification processing cron job.
 * This can be called from the admin panel or during app initialization.
 */
export async function setupNotificationCron() {
  try {
    const { data, error } = await supabase.functions.invoke('setup-notification-cron');
    
    if (error) {
      console.error('Error setting up notification cron:', error);
      return { success: false, error };
    }
    
    console.log('Notification cron setup result:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exception setting up notification cron:', err);
    return { success: false, error: err.message };
  }
}
