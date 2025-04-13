
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';

/**
 * Utility function to add a notification to the queue with better error handling
 */
export async function addToNotificationQueue(type: string, payload: StandardNotificationPayload, recipientType: string, paymentId?: string) {
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
