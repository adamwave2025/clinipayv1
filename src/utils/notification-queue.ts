
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
  console.log(`⚠️ CRITICAL: Adding notification to queue: type=${type}, recipient=${recipient_type}, clinic=${clinic_id}, reference=${reference_id || 'none'}`);
  const startTime = Date.now();
  
  try {
    // Create a safe copy of the payload to avoid circular references
    // Using JSON.parse(JSON.stringify()) to completely break any reference chains
    const payloadCopy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    let notificationId: string | null = null;
    
    // Start a Supabase transaction to ensure the notification record is created
    const { data, error } = await supabase
      .from('notification_queue')
      .insert({
        type,
        payload: payloadCopy as Json, // This avoids the recursive type issue
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
      
      // Create a safe copy of the webhook response to avoid type issues
      // Explicitly create a new object with only the properties we need
      const responseDetails = webhookResult.details ? 
        { 
          status: webhookResult.details.status, 
          responseBody: webhookResult.details.responseBody 
        } : {};
      
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
      
      return { 
        success: true, 
        notification_id: notificationId, 
        webhook_success: true 
      };
    } else {
      console.error(`⚠️ CRITICAL ERROR: Direct webhook call failed for notification ${notificationId}:`, webhookResult.error);
      
      // Create a safe copy of the error details with explicitly defined structure
      const errorDetails = webhookResult.details ? {
        status: webhookResult.details.status,
        statusText: webhookResult.details.statusText,
        responseBody: webhookResult.details.responseBody,
        webhook: webhookResult.details.webhook,
        recipientType: webhookResult.details.recipientType
      } : {};
      
      // Update the notification record with the error
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({ 
          status: 'failed',
          last_attempt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: webhookResult.error?.substring(0, 255) || 'Unknown error',
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
      
      // Still return success for the queueing part, but indicate webhook failure
      return { 
        success: true, 
        notification_id: notificationId, 
        webhook_success: false,
        webhook_error: webhookResult.error,
        error_details: webhookResult.details
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', errorMessage);
    if (errorStack) console.error('Error stack:', errorStack);
    
    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️ Total notification processing time: ${elapsedTime}ms (exception)`);
    
    return { 
      success: false, 
      error: errorMessage,
      stack: errorStack
    };
  }
}

/**
 * Check if a notification has already been sent for a specific reference
 */
export async function checkNotificationExists(
  type: string,
  recipient_type: 'patient' | 'clinic',
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
