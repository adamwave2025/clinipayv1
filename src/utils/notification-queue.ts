
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';

/**
 * Add an item to the notification queue for processing
 */
export async function addToNotificationQueue(
  type: string,
  payload: StandardNotificationPayload,
  recipient_type: 'patient' | 'clinic',
  clinic_id: string,
  reference_id?: string,
  payment_id?: string
) {
  console.log(`Adding notification to queue: type=${type}, recipient=${recipient_type}, clinic=${clinic_id}`);
  
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        type,
        payload,
        recipient_type,
        clinic_id,
        reference_id,
        payment_id,
        status: 'pending',
        retry_count: 0
      })
      .select();

    if (error) {
      console.error('Error adding to notification queue:', error);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      console.error('No data returned from notification queue insertion');
      return { success: false, error: 'No data returned' };
    }

    const queuedItem = data[0];
    console.log(`✅ Successfully queued notification with id: ${queuedItem.id}`);

    return { success: true, notification_id: queuedItem.id };
  } catch (error) {
    console.error('Exception adding to notification queue:', error);
    return { success: false, error };
  }
}
