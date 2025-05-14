
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';
import { callWebhookDirectly } from './webhook-caller';
import { processNotificationsNow, triggerNotificationFallback } from './notification-cron-setup';
import { toast } from 'sonner';

/**
 * Add an item to the notification queue for processing and immediately call webhook
 * @param type The type of notification
 * @param payload The notification payload
 * @param recipient_type The recipient type ('patient' or 'clinic')
 * @param clinic_id The clinic ID
 * @param reference_id Optional reference ID
 * @param payment_id Optional payment ID
 * @param processImmediately If true, will also trigger the notification queue processing after adding to queue
 */
export async function addToNotificationQueue(
  type: string,
  payload: StandardNotificationPayload,
  recipient_type: 'patient' | 'clinic',
  clinic_id: string,
  reference_id?: string,
  payment_id?: string,
  processImmediately = false
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
    const jsonPayload = payload as unknown as Json;
    
    console.log('⚠️ CRITICAL: Current auth state:', JSON.stringify({
      isLoggedIn: !!(await supabase.auth.getSession()).data.session,
      clinic_id: clinic_id
    }));
    
    // Insert into notification queue
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        type,
        payload: jsonPayload,
        recipient_type,
        ...(payment_id ? { payment_id } : {}),
        status: 'pending',
        retry_count: 0
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

    // DIRECT WEBHOOK CALL - First delivery attempt
    console.log(`⚠️ CRITICAL: Calling webhook directly...`);
    const webhookResult = await callWebhookDirectly(payload, recipient_type);
    
    // Track delivery method success
    let webhookSuccess = false;
    let edgeFunctionSuccess = false;
    let fallbackSuccess = false;
    
    if (webhookResult.success) {
      console.log(`⚠️ CRITICAL SUCCESS: Direct webhook call successful`);
      webhookSuccess = true;
      
      // Mark notification as sent since direct delivery succeeded
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
    
    // If processImmediately is true or direct webhook failed, trigger the notification queue processing
    if (processImmediately || !webhookSuccess) {
      console.log(`⚠️ CRITICAL: ${processImmediately ? 'processImmediately=true' : 'Direct webhook failed'}, triggering edge function...`);
      
      try {
        // EDGE FUNCTION CALL - Second delivery attempt
        const processingResult = await processNotificationsNow();
        console.log(`⚠️ CRITICAL: Edge function result:`, processingResult);
        
        if (processingResult.success) {
          edgeFunctionSuccess = true;
        } else if (!webhookSuccess) {
          // Only try fallback if both primary methods failed
          console.log(`⚠️ CRITICAL: Both direct webhook and edge function failed, trying fallback...`);
          
          // FALLBACK WEBHOOK - Third delivery attempt
          const fallbackResult = await triggerNotificationFallback();
          if (fallbackResult.success) {
            fallbackSuccess = true;
          }
        }
      } catch (procError) {
        console.error('⚠️ CRITICAL ERROR: Failed to trigger notification processing:', procError);
      }
    }
    
    // Show warning toast if all delivery methods failed
    if (!webhookSuccess && !edgeFunctionSuccess && !fallbackSuccess && processImmediately) {
      // This notification is important (processImmediately=true) but all immediate delivery methods failed
      toast.warning("Payment link was sent, but notification delivery might be delayed");
    }
    
    return { 
      success: true, 
      notification_id: queuedItem.id, 
      delivery: {
        webhook: webhookSuccess,
        edge_function: edgeFunctionSuccess,
        fallback: fallbackSuccess,
        any_success: webhookSuccess || edgeFunctionSuccess || fallbackSuccess
      },
      errors: {
        webhook: !webhookSuccess ? webhookResult.error : undefined
      },
      immediate_processing: processImmediately
    };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', error);
    return { success: false, error };
  }
}
