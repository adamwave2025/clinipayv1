
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Utility function to set up the notification processing cron job.
 * This can be called from the admin panel or during app initialization.
 */
export async function setupNotificationCron() {
  try {
    console.log('Setting up notification cron job...');
    
    // First check if essential system settings exist for notifications
    const { data: settingsData, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .in('key', ['patient_notification_webhook', 'clinic_notification_webhook']);
    
    if (settingsError) {
      console.error('Error checking notification settings:', settingsError);
      
      // Don't stop the process, but log a warning that notifications might not work
      console.warn('Notification system settings may not be properly configured');
    } else if (!settingsData || settingsData.length < 2) {
      // Setup default webhook URLs if they don't exist
      try {
        // These are placeholder values - in production these would be real webhook URLs
        const webhooks = [
          { 
            key: 'patient_notification_webhook', 
            value: 'https://notification-service.clinipay.co.uk/patient-notifications'
          },
          {
            key: 'clinic_notification_webhook',
            value: 'https://notification-service.clinipay.co.uk/clinic-notifications'
          }
        ];
        
        // Insert any missing webhooks
        for (const webhook of webhooks) {
          const { data: existingData } = await supabase
            .from('system_settings')
            .select('*')
            .eq('key', webhook.key)
            .maybeSingle();
          
          if (!existingData) {
            console.log(`Setting up default webhook for ${webhook.key}`);
            await supabase
              .from('system_settings')
              .insert(webhook);
          }
        }
        
        console.log('Default notification webhooks configured');
      } catch (err) {
        console.error('Error setting up default webhooks:', err);
      }
    } else {
      console.log('Notification webhooks already configured:', settingsData);
    }
    
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
    console.log('Processing notifications immediately...');
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

/**
 * Utility function to add a notification to the queue with better error handling
 */
export async function addToNotificationQueue(type: string, payload: any, recipientType: string, paymentId?: string) {
  console.log(`Adding ${recipientType} notification to queue: ${type}`, payload);
  
  try {
    // Add to notification queue - properly convert to Json type
    const { data, error } = await supabase
      .from("notification_queue")
      .insert({
        type,
        payload,
        recipient_type: recipientType,
        payment_id: paymentId,
        status: 'pending'
      })
      .select();

    if (error) {
      console.error("Error queueing notification:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Check if this is a permissions issue
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        console.error("This appears to be a permissions error - check RLS policies");
      }
      
      return { success: false, error };
    }

    console.log(`${recipientType} notification queued successfully:`, data);
    return { success: true, data };
  } catch (err: any) {
    console.error("Critical error during notification queueing:", err);
    return { success: false, error: err.message };
  }
}
