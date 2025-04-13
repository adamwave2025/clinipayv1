
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';

/**
 * Utility function to add a notification to the queue with better error handling
 */
export async function addToNotificationQueue(type: string, payload: StandardNotificationPayload, recipientType: string, paymentId?: string) {
  console.log(`Adding ${recipientType} notification to queue: ${type}`, payload);
  console.log(`Payload structure details:`, JSON.stringify(payload, null, 2));
  
  try {
    // Check if system webhooks are configured 
    console.log('Checking if notification webhooks are configured...');
    const { data: webhooks, error: webhookError } = await supabase
      .from('system_settings')
      .select('*')
      .in('key', ['patient_notification_webhook', 'clinic_notification_webhook']);
    
    if (webhookError) {
      console.error('Error checking webhook configuration:', webhookError);
    } else {
      if (!webhooks || webhooks.length < 2) {
        console.warn('Notification webhooks not fully configured in system_settings:');
        console.log('Found webhooks:', webhooks);
      } else {
        console.log('Notification webhooks are configured correctly:', webhooks);
      }
    }
    
    // Log permission check for notification_queue table
    console.log('Checking notification_queue table access...');
    try {
      const { data: permissionCheck, error: permissionError } = await supabase
        .from('notification_queue')
        .select('id')
        .limit(1);
      
      if (permissionError) {
        console.error('Permission check failed for notification_queue table:', permissionError);
      } else {
        console.log('Successfully accessed notification_queue table, permissions OK');
      }
    } catch (permErr) {
      console.error('Exception during permission check:', permErr);
    }
    
    // Add to notification queue - properly convert to Json type
    console.log('Attempting to insert notification...');
    const { data, error } = await supabase
      .from("notification_queue")
      .insert({
        type,
        payload: payload as unknown as Json,
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
