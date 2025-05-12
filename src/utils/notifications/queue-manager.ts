
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { NotificationResponse, NotificationStatus, RecipientType, FlatJsonValue } from './types';
import { Json } from '@/integrations/supabase/types';
import { callWebhookDirectly } from './webhook-client';
import { createPrimitivePayload, createErrorDetails, safeString } from './json-utils';

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
    // Create a safe copy of the payload without circular references
    const primitivePayload = createPrimitivePayload(payload);
    let notificationId: string | null = null;
    
    // Insert into notification queue 
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        type,
        payload: primitivePayload as Json, 
        recipient_type,
        clinic_id,
        reference_id,
        status: 'pending' as NotificationStatus,
        retry_count: 0,
        payment_id,
        priority: 'high'
      })
      .select();

    if (error) {
      console.error('⚠️ CRITICAL ERROR: Failed to add to notification queue:', error);
      return { success: false, error_message: error.message };
    }

    if (!data || data.length === 0) {
      console.error('⚠️ CRITICAL ERROR: No data returned from notification queue insertion');
      return { success: false, error_message: 'No data returned' };
    }

    const queuedItem = data[0];
    notificationId = queuedItem.id;
    console.log(`⚠️ CRITICAL: Successfully queued notification with id: ${notificationId}`);

    // DIRECTLY call the webhook immediately
    console.log(`⚠️ CRITICAL: Calling webhook directly for notification ${notificationId}...`);
    const webhookResult = await callWebhookDirectly(payload, recipient_type);
    
    if (webhookResult.success) {
      console.log(`⚠️ CRITICAL SUCCESS: Webhook call successful for notification ${notificationId}`);
      
      // Create a simple response details object with primitive values
      const responseDetails: Record<string, FlatJsonValue> = {
        status: webhookResult.status_code || 200,
        responseBody: webhookResult.response_body || ''
      };
      
      // Update the queue item to mark it as processed
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'sent' as NotificationStatus,
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
        webhook_success: true,
        status_code: webhookResult.status_code
      };
    } else {
      console.error(`⚠️ CRITICAL ERROR: Direct webhook call failed for notification ${notificationId}:`, webhookResult.error);
      
      // Create a record with only primitive values for error details
      const errorDetails: Record<string, FlatJsonValue> = {
        status: webhookResult.status_code || 0,
        error: safeString(webhookResult.error),
        responseBody: safeString(webhookResult.response_body),
        recipientType: recipient_type
      };
      
      // Update the notification record with the error
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'failed' as NotificationStatus,
          last_attempt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: safeString(webhookResult.error),
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
      
      return { 
        success: true, 
        notification_id: notificationId, 
        webhook_success: false,
        webhook_error: safeString(webhookResult.error),
        error: safeString(webhookResult.error), // Add the error property to match the expected type
        status_code: webhookResult.status_code
      };
    }
  } catch (error) {
    // Convert the error to a simple string
    const errorMessage = error instanceof Error ? safeString(error.message) : 'Unknown error';
    
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', errorMessage);
    
    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️ Total notification processing time: ${elapsedTime}ms (exception)`);
    
    // Return a simple flat structure
    return { 
      success: false, 
      error_message: errorMessage,
      error: errorMessage // Add the error property to match the expected type
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
