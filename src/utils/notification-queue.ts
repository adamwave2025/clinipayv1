
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';
import { callWebhookDirectly } from './webhook-caller';

/**
 * Add an item to the notification queue for processing and immediately call webhook
 */
export async function addToNotificationQueue(
  type: string,
  payload: StandardNotificationPayload,
  recipient_type: 'patient' | 'clinic',
  clinic_id: string,
  reference_id?: string,
  payment_id?: string
) {
  console.log(`⚠️ CRITICAL: Adding notification to queue: type=${type}, recipient=${recipient_type}, clinic=${clinic_id}, reference=${reference_id}`);
  
  try {
    // Convert the StandardNotificationPayload to Json compatible format
    // This explicit cast ensures we satisfy TypeScript's type checking
    const jsonPayload = payload as unknown as Json;
    
    // Insert into notification queue with high priority
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
        priority: 'high'
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
    console.log(`⚠️ CRITICAL SUCCESS: Successfully queued notification with id: ${queuedItem.id}`);

    // DIRECTLY call the webhook immediately instead of relying on edge function
    console.log(`⚠️ CRITICAL: Calling webhook directly...`);
    const webhookResult = await callWebhookDirectly(payload, recipient_type);
    
    if (webhookResult.success) {
      console.log(`⚠️ CRITICAL SUCCESS: Webhook call successful`);
      
      // Update the queue item to mark it as processed
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'sent',
          processed_at: new Date().toISOString(),
          last_attempt: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', queuedItem.id);
      
      if (updateError) {
        console.error('⚠️ CRITICAL: Failed to update notification status:', updateError);
      }
      
      return { 
        success: true, 
        notification_id: queuedItem.id, 
        webhook_success: true 
      };
    } else {
      console.error('⚠️ CRITICAL ERROR: Direct webhook call failed:', webhookResult.error);
      
      // Still return success for the queueing part, but indicate webhook failure
      return { 
        success: true, 
        notification_id: queuedItem.id, 
        webhook_success: false,
        webhook_error: webhookResult.error
      };
    }
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', error);
    return { success: false, error };
  }
}
