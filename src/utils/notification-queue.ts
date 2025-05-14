
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';
import { callWebhookDirectly } from './webhook-caller';
import { processNotificationsNow } from './notification-cron-setup';

/**
 * Add an item to the notification queue for processing and immediately call webhook
 * @param processImmediately If true, will also trigger the notification queue processing after adding to queue
 */
export async function addToNotificationQueue(
  type: string,
  payload: StandardNotificationPayload,
  recipient_type: 'patient' | 'clinic',
  clinic_id: string,
  reference_id?: string,
  payment_id?: string,
  processImmediately = false // Explicitly add this parameter with default false
) {
  console.log(`⚠️ CRITICAL: Adding notification to queue: type=${type}, recipient=${recipient_type}, reference=${reference_id}`);
  console.log(`⚠️ CRITICAL: Using clinic_id=${clinic_id}`);
  console.log(`⚠️ CRITICAL: Payload details:`, JSON.stringify(payload, null, 2));
  
  try {
    // Ensure clinic ID is valid
    if (!clinic_id) {
      console.error('⚠️ CRITICAL ERROR: Missing clinic_id for notification queue insertion');
      return { success: false, error: 'Missing clinic_id' };
    }
    
    // Ensure clinic ID is also in the payload for RLS purposes
    if (payload.clinic && typeof payload.clinic === 'object') {
      if (!payload.clinic.id) {
        console.log('⚠️ CRITICAL: Adding clinic_id to payload.clinic');
        payload.clinic.id = clinic_id;
      } else if (payload.clinic.id !== clinic_id) {
        console.warn(`⚠️ CRITICAL WARNING: Different clinic IDs: payload=${payload.clinic.id}, parameter=${clinic_id}`);
        // Use the provided clinic_id to ensure RLS works
        payload.clinic.id = clinic_id;
      }
    } else {
      console.error('⚠️ CRITICAL ERROR: Payload has no clinic object or it is not properly formatted');
      return { success: false, error: 'Invalid payload structure: missing clinic object' };
    }
    
    // Convert the StandardNotificationPayload to Json compatible format
    // This explicit cast ensures we satisfy TypeScript's type checking
    const jsonPayload = payload as unknown as Json;
    
    console.log('⚠️ CRITICAL: Current auth state:', JSON.stringify({
      isLoggedIn: !!(await supabase.auth.getSession()).data.session,
      clinic_id: clinic_id
    }));
    
    // Insert into notification queue with only the columns that exist in the database
    // Based on the database schema, only include valid columns
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        type,
        payload: jsonPayload,
        recipient_type,
        // Only include payment_id if provided
        ...(payment_id ? { payment_id } : {}),
        status: 'pending',
        retry_count: 0
        // REMOVED: clinic_id: clinic_id - This column doesn't exist in the database
        // but the clinic_id is included in the payload.clinic.id for RLS purposes
      })
      .select();

    if (error) {
      console.error('⚠️ CRITICAL ERROR: Failed to add to notification queue:', error);
      console.error('⚠️ CRITICAL ERROR: Error details:', JSON.stringify(error));
      console.error('⚠️ CRITICAL ERROR: Payload causing error:', JSON.stringify({
        type,
        recipient_type,
        has_payment_id: !!payment_id,
        clinic_id: clinic_id
      }));
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
    
    // Continue with the normal flow regardless of webhook result
    let webhookSuccess = false;
    
    if (webhookResult.success) {
      console.log(`⚠️ CRITICAL SUCCESS: Webhook call successful`);
      webhookSuccess = true;
      
      // Update the queue item to mark it as processed
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'sent',
          processed_at: new Date().toISOString()
        })
        .eq('id', queuedItem.id);
      
      if (updateError) {
        console.error('⚠️ CRITICAL: Failed to update notification status:', updateError);
      }
    } else {
      console.error('⚠️ CRITICAL ERROR: Direct webhook call failed:', webhookResult.error);
    }
    
    // If processImmediately is true, trigger the notification queue processing REGARDLESS of webhook result
    // This is the critical part - it's a safety net in case the direct webhook call fails
    if (processImmediately) {
      console.log(`⚠️ CRITICAL: processImmediately=true, triggering notification queue processing via edge function`);
      
      try {
        // Call the notification processor edge function via helper
        const processingResult = await processNotificationsNow();
        console.log(`⚠️ CRITICAL: Notification processing triggered:`, processingResult);
      } catch (procError) {
        console.error('⚠️ CRITICAL ERROR: Failed to trigger notification processing:', procError);
        // Still return success for the queueing part - we have multiple fallbacks
      }
    }
    
    return { 
      success: true, 
      notification_id: queuedItem.id, 
      webhook_success: webhookSuccess,
      webhook_error: webhookSuccess ? undefined : webhookResult.error,
      immediate_processing: processImmediately
    };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', error);
    return { success: false, error };
  }
}
