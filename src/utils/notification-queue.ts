
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';
import { processNotificationsNow } from './notification-cron-setup';

/**
 * Add an item to the notification queue for processing and immediately attempt to process
 */
export async function addToNotificationQueue(
  type: string,
  payload: StandardNotificationPayload,
  recipient_type: 'patient' | 'clinic',
  clinic_id: string,
  reference_id?: string,
  payment_id?: string
) {
  console.log(`⚠️ CRITICAL: Adding notification to queue: type=${type}, recipient=${recipient_type}, clinic=${clinic_id}`);
  
  try {
    // Convert the StandardNotificationPayload to Json compatible format
    // This explicit cast ensures we satisfy TypeScript's type checking
    const jsonPayload = payload as unknown as Json;
    
    // Insert into notification queue with high priority for immediate processing
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        type,
        payload: jsonPayload,
        recipient_type,
        clinic_id,
        reference_id,
        status: 'pending',
        retry_count: 0,
        payment_id,
        priority: 'high' // Add high priority to ensure it's processed immediately
      })
      .select();

    if (error) {
      console.error('⚠️ CRITICAL ERROR: Failed to add to notification queue:', error);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      console.error('⚠️ CRITICAL ERROR: No data returned from notification queue insertion');
      return { success: false, error: 'No data returned' };
    }

    const queuedItem = data[0];
    console.log(`⚠️ CRITICAL: Successfully queued notification with id: ${queuedItem.id}`);

    // Immediately attempt to process the notification
    console.log(`⚠️ CRITICAL: Triggering immediate processing of the notification...`);
    
    try {
      // Process notifications immediately
      const processResult = await processNotificationsNow();
      
      if (processResult.success) {
        console.log(`⚠️ CRITICAL SUCCESS: Immediately processed notification ${queuedItem.id}`);
      } else {
        console.error(`⚠️ CRITICAL ERROR: Failed to process notification immediately:`, processResult.error);
      }
      
      // Return success regardless of processing result, as the item is in the queue
      return { success: true, notification_id: queuedItem.id, processed: processResult.success };
    } catch (processError) {
      console.error('⚠️ CRITICAL ERROR: Exception during immediate processing:', processError);
      // Still return success for the queueing part
      return { success: true, notification_id: queuedItem.id, processed: false, processError };
    }
    
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', error);
    return { success: false, error };
  }
}
