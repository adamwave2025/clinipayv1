
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { NotificationResponse, NotificationStatus, PrimitiveJsonObject, RecipientType } from './types';
import { Json } from '@/integrations/supabase/types';
import { callWebhookDirectly } from './webhook-client';
import { createPrimitivePayload } from './json-utils';

/**
 * Add an item to the notification queue for processing and immediately call webhook
 */
export async function addToNotificationQueue(
  type: string,
  payload: StandardNotificationPayload,
  recipient_type: RecipientType,
  clinic_id: string,
  reference_id?: string,
  payment_id?: string
): Promise<NotificationResponse> {
  console.log(`⚠️ CRITICAL: Adding notification to queue: type=${type}, recipient=${recipient_type}, clinic=${clinic_id}, reference=${reference_id || 'none'}`);
  const startTime = Date.now();
  
  try {
    // Create a safe copy of the payload to avoid circular references
    const primitivePayload: PrimitiveJsonObject = createPrimitivePayload(payload);
    
    let notificationId: string | null = null;
    
    // Start a Supabase transaction to ensure the notification record is created
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        type,
        payload: primitivePayload as Json, // Safe cast with our primitive structure
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
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error('⚠️ CRITICAL ERROR: No data returned from notification queue insertion');
      return { success: false, error: 'No data returned' };
    }

    const queuedItem = data[0];
    notificationId = queuedItem.id;
    console.log(`⚠️ CRITICAL: Successfully queued notification with id: ${notificationId}`);

    // DIRECTLY call the webhook immediately instead of relying on edge function
    console.log(`⚠️ CRITICAL: Calling webhook directly for notification ${notificationId}...`);
    const webhookResult = await callWebhookDirectly(payload, recipient_type);
    
    if (webhookResult.success) {
      console.log(`⚠️ CRITICAL SUCCESS: Webhook call successful for notification ${notificationId}`);
      
      // Create a simple response details object with only primitive values
      const responseDetails: PrimitiveJsonObject = {};
      if (webhookResult.details) {
        if (typeof webhookResult.details.status === 'number') {
          responseDetails.status = webhookResult.details.status;
        }
        if (typeof webhookResult.details.responseBody === 'string') {
          responseDetails.responseBody = webhookResult.details.responseBody.substring(0, 255);
        }
      }
      
      // Update the queue item to mark it as processed
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'sent',
          processed_at: new Date().toISOString(),
          last_attempt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          response_data: responseDetails as Json
        })
        .eq('id', notificationId);
      
      if (updateError) {
        console.error(`⚠️ CRITICAL: Failed to update notification ${notificationId} status:`, updateError);
      } else {
        console.log(`✅ Updated notification ${notificationId} status to 'sent'`);
      }
      
      const elapsedTime = Date.now() - startTime;
      console.log(`⏱️ Total notification processing time: ${elapsedTime}ms`);
      
      // Return a simple flat object with primitive types only
      return { 
        success: true, 
        notification_id: notificationId, 
        webhook_success: true 
      };
    } else {
      console.error(`⚠️ CRITICAL ERROR: Direct webhook call failed for notification ${notificationId}:`, webhookResult.error);
      
      // Create a simplified error details object with only primitive values
      const errorDetails: PrimitiveJsonObject = {
        status: 0,
        statusText: '',
        responseBody: '',
        webhook: '',
        recipientType: ''
      };
      
      // Safely extract error details
      if (webhookResult.details) {
        if (webhookResult.details.status !== undefined) {
          errorDetails.status = Number(webhookResult.details.status) || 0;
        }
        
        if (typeof webhookResult.details.statusText === 'string') {
          errorDetails.statusText = webhookResult.details.statusText.substring(0, 255);
        }
        
        if (typeof webhookResult.details.responseBody === 'string') {
          errorDetails.responseBody = webhookResult.details.responseBody.substring(0, 255);
        }
        
        if (typeof webhookResult.details.webhook === 'string') {
          errorDetails.webhook = webhookResult.details.webhook.substring(0, 255);
        }
        
        if (typeof webhookResult.details.recipientType === 'string') {
          errorDetails.recipientType = webhookResult.details.recipientType;
        }
      }
      
      // Update the notification record with the error
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'failed',
          last_attempt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: webhookResult.error ? webhookResult.error.substring(0, 255) : 'Unknown error',
          response_data: errorDetails as Json
        })
        .eq('id', notificationId);
        
      if (updateError) {
        console.error(`⚠️ CRITICAL: Failed to update failed notification ${notificationId}:`, updateError);
      } else {
        console.log(`⚠️ Updated notification ${notificationId} status to 'failed'`);
      }
      
      const elapsedTime = Date.now() - startTime;
      console.log(`⏱️ Total notification processing time: ${elapsedTime}ms (failed)`);
      
      // Fix for infinite type recursion - Use a flat structure with all primitive values
      return { 
        success: true, 
        notification_id: notificationId, 
        webhook_success: false,
        webhook_error: webhookResult.error ? webhookResult.error.substring(0, 255) : 'Unknown error',
        error_status: errorDetails.status as number,
        error_status_text: errorDetails.statusText as string,
        error_response: errorDetails.responseBody as string,
        error_webhook: errorDetails.webhook as string,
        error_recipient: errorDetails.recipientType as string
      };
    }
  } catch (error) {
    // Fix for infinite type recursion - Create a completely flat error response with only primitive values
    const errorMessage = error instanceof Error ? error.message.substring(0, 255) : 'Unknown error';
    
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', errorMessage);
    
    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️ Total notification processing time: ${elapsedTime}ms (exception)`);
    
    // Return a completely flat structure with primitive values only - no nested objects or arrays
    return { 
      success: false, 
      error_message: errorMessage,
      error_type: error instanceof Error ? 'Error' : typeof error,
      processing_time_ms: elapsedTime
    };
  }
}

/**
 * Check if a notification has already been sent for a specific reference
 */
export async function checkNotificationExists(
  type: string,
  recipient_type: RecipientType,
  reference_id: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('notification_queue')
      .select('id, status')
      .eq('type', type)
      .eq('recipient_type', recipient_type)
      .eq('reference_id', reference_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking for existing notification:', error);
      return false;
    }
    
    if (data && (data.status === 'sent' || data.status === 'pending')) {
      console.log(`Found existing notification for reference ${reference_id}, status: ${data.status}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking notification existence:', error);
    return false;
  }
}
