
import { supabase } from '@/integrations/supabase/client';
import { NotificationPayload, NotificationResponse, RecipientType } from './types';
import { callWebhookDirectly } from './webhook-service';
import { isValidNotificationPayload, preparePayloadForStorage, safelyParseNotificationPayload } from './validators';

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
  payload: any, // Using any to break type dependency chain
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
  
  // Validate payload structure
  if (!isValidNotificationPayload(payload)) {
    console.error('Invalid notification payload structure:', payload);
    return {
      success: false,
      error: 'Invalid notification payload structure',
      webhook_success: false,
      webhook_error: 'Invalid payload'
    };
  }
  
  // Prepare payload for storage - this breaks any circular references
  // and avoids the deep type instantiation issue
  const jsonPayload = preparePayloadForStorage(payload);
  
  // Create a notification record in the queue
  const { data: notification, error } = await supabase
    .from('notification_queue')
    .insert({
      type,
      payload: jsonPayload,
      recipient_type,
      status: 'pending',
      error_message: null,
      retry_count: 0,
      reference_id
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
    // Using the runtime-validated payload directly
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
      // Breaking the type chain - use raw data without strong typing initially
      const rawPayload = notification.payload ? JSON.parse(JSON.stringify(notification.payload)) : null;
      
      if (!rawPayload) {
        throw new Error('Invalid or missing payload');
      }
      
      // Only validate the structure but don't create deep type dependencies
      if (!isValidNotificationPayload(rawPayload)) {
        throw new Error('Invalid notification payload structure');
      }
      
      // Process with webhook service - pass as any to avoid complex type checking
      const webhookResult = await callWebhookDirectly(
        rawPayload as any,
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
          retry_count: notification.retry_count + 1,
          error_message: error.message || 'Unknown error during processing',
          processed_at: new Date().toISOString()
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
