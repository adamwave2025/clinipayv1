
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';
import { NotificationResponse, RecipientType } from './notifications/types';
import { callWebhookDirectly } from './webhook-caller';
import { createPrimitivePayload } from './notifications/json-utils';

/**
 * Adds a notification to the queue and optionally processes it immediately
 * 
 * @param type The type of notification (e.g., payment_request, payment_success)
 * @param payload The notification payload
 * @param recipient_type Who should receive the notification (patient or clinic)
 * @param clinic_id The clinic ID
 * @param reference_id Optional reference ID (e.g., payment request ID)
 * @param payment_id Optional payment ID
 * @returns Promise with notification response
 */
export async function addToNotificationQueue(
  type: string,
  payload: StandardNotificationPayload,
  recipient_type: RecipientType,
  clinic_id: string,
  reference_id?: string,
  payment_id?: string
): Promise<NotificationResponse> {
  console.log('Adding notification to queue:', {
    type,
    recipient_type,
    clinic_id,
    reference_id,
    payment_id
  });
  
  // Create a notification record in the queue
  // Convert the StandardNotificationPayload to a Json compatible object
  const jsonPayload = JSON.parse(JSON.stringify(payload)) as Json;
  
  const { data: notification, error } = await supabase
    .from('notification_queue')
    .insert({
      type,
      payload: jsonPayload,
      recipient_type,
      status: 'pending',
      error_message: null,
      retry_count: 0
    })
    .select('id')
    .single();
    
  if (error) {
    console.error('Failed to add notification to queue:', error);
    return {
      success: false,
      error: error.message,
      webhook_success: false,
      webhook_error: 'Failed to create notification record'
    };
  }
  
  const notificationId = notification.id;
  console.log('Created notification with ID:', notificationId);
  
  // Now call the webhook directly for immediate processing
  try {
    const webhookResult = await callWebhookDirectly(payload, recipient_type);
    
    // Update the notification record with the result
    await supabase
      .from('notification_queue')
      .update({
        status: webhookResult.success ? 'processed' : 'failed',
        error_message: webhookResult.error || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', notificationId);
      
    console.log('Webhook call result:', webhookResult);
    
    return {
      success: true,
      notification_id: notificationId,
      webhook_success: webhookResult.success,
      webhook_error: webhookResult.error
    };
  } catch (webhookError: any) {
    console.error('Error calling webhook directly:', webhookError);
    
    // Update the notification record with the error
    await supabase
      .from('notification_queue')
      .update({
        status: 'failed',
        error_message: webhookError.message || 'Unknown webhook error',
        processed_at: new Date().toISOString()
      })
      .eq('id', notificationId);
      
    return {
      success: true,
      notification_id: notificationId,
      webhook_success: false,
      webhook_error: webhookError.message || 'Unknown webhook error'
    };
  }
}

/**
 * Checks if a notification exists with the given parameters
 */
export async function checkNotificationExists(
  type: string,
  recipient_type: RecipientType,
  reference_id: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('notification_queue')
    .select('*', { count: 'exact', head: true })
    .eq('type', type)
    .eq('recipient_type', recipient_type)
    .eq('reference_id', reference_id);
    
  if (error) {
    console.error('Error checking if notification exists:', error);
    return false;
  }
  
  return count !== null && count > 0;
}

/**
 * Process pending notifications immediately
 */
export async function processNotificationsNow(): Promise<{
  success: boolean;
  processed: number;
  failed: number;
}> {
  // Get all pending notifications
  const { data: pendingNotifications, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching pending notifications:', error);
    return { success: false, processed: 0, failed: 0 };
  }
  
  if (!pendingNotifications || pendingNotifications.length === 0) {
    console.log('No pending notifications to process');
    return { success: true, processed: 0, failed: 0 };
  }
  
  console.log(`Processing ${pendingNotifications.length} pending notifications...`);
  
  let processed = 0;
  let failed = 0;
  
  // Process each notification
  for (const notification of pendingNotifications) {
    try {
      // First convert to unknown then to StandardNotificationPayload to avoid typing issues
      // This breaks the deep type instantiation chain
      const payload = notification.payload as unknown;
      
      // Now we can safely cast to our expected type
      const typedPayload = payload as StandardNotificationPayload;
      
      const webhookResult = await callWebhookDirectly(
        typedPayload,
        notification.recipient_type as RecipientType
      );
      
      // Update the notification record
      await supabase
        .from('notification_queue')
        .update({
          status: webhookResult.success ? 'processed' : 'failed',
          error_message: webhookResult.error || null,
          processed_at: new Date().toISOString(),
          retry_count: notification.retry_count + 1
        })
        .eq('id', notification.id);
        
      if (webhookResult.success) {
        processed++;
      } else {
        failed++;
        console.error(`Failed to process notification ${notification.id}:`, webhookResult.error);
      }
    } catch (error: any) {
      failed++;
      console.error(`Error processing notification ${notification.id}:`, error);
      
      // Update the notification record with the error
      await supabase
        .from('notification_queue')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error during processing',
          processed_at: new Date().toISOString(),
          retry_count: notification.retry_count + 1
        })
        .eq('id', notification.id);
    }
  }
  
  console.log(`Notification processing complete: ${processed} processed, ${failed} failed`);
  
  return {
    success: true,
    processed,
    failed
  };
}
