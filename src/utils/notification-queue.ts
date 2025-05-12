
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';
import { callWebhookDirectly } from './webhook-caller';

/**
 * Type definition for primitive objects that can safely be stored in the database
 */
interface PrimitiveJsonObject {
  [key: string]: string | number | boolean | null | PrimitiveJsonObject | (string | number | boolean | null)[];
}

/**
 * Helper function to safely convert any object to a primitive Json-safe structure
 */
function toPrimitiveJson(data: unknown): PrimitiveJsonObject {
  if (data === null || data === undefined) {
    return {};
  }
  
  if (typeof data !== 'object') {
    return { value: String(data) };
  }
  
  // Create a basic primitive object
  const result: PrimitiveJsonObject = {};
  
  // Only copy primitive properties to avoid circular references
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = null;
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = value;
    } else if (typeof value === 'object') {
      try {
        // For objects, create a simple string representation or extract key properties
        result[key] = JSON.stringify(value).substring(0, 255);
      } catch (err) {
        result[key] = 'Complex object (cannot stringify)';
      }
    } else {
      // Convert any other types to strings
      result[key] = String(value);
    }
  }
  
  return result;
}

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
    // We manually construct a primitive object with only the properties we need
    const primitivePayload: PrimitiveJsonObject = {
      notification_type: payload.notification_type,
      notification_method: {
        email: payload.notification_method.email,
        sms: payload.notification_method.sms
      },
      patient: {
        name: payload.patient.name,
        email: payload.patient.email || null,
        phone: payload.patient.phone || null
      },
      payment: {
        reference: payload.payment.reference,
        amount: payload.payment.amount,
        refund_amount: payload.payment.refund_amount || null,
        payment_link: payload.payment.payment_link || null,
        message: payload.payment.message
      },
      clinic: {
        name: payload.clinic.name,
        email: payload.clinic.email || null,
        phone: payload.clinic.phone || null,
        address: payload.clinic.address || null
      }
    };
    
    // Add financial details if present, but only with primitive values
    if (payload.payment.financial_details) {
      // Fix for spread operator error - create a new object instead of spreading
      primitivePayload.payment = {
        reference: payload.payment.reference,
        amount: payload.payment.amount,
        refund_amount: payload.payment.refund_amount || null,
        payment_link: payload.payment.payment_link || null,
        message: payload.payment.message,
        financial_details: {
          gross_amount: payload.payment.financial_details.gross_amount,
          stripe_fee: payload.payment.financial_details.stripe_fee,
          platform_fee: payload.payment.financial_details.platform_fee,
          net_amount: payload.payment.financial_details.net_amount
        }
      };
    }
    
    // Add error information if present
    if (payload.error) {
      primitivePayload.error = {
        message: payload.error.message,
        code: payload.error.code
      };
    }
    
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
    const errorStack = error instanceof Error ? 
      error.stack ? error.stack.substring(0, 255) : undefined : 
      undefined;
    
    console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', errorMessage);
    if (errorStack) console.error('Error stack:', errorStack);
    
    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️ Total notification processing time: ${elapsedTime}ms (exception)`);
    
    // Return a flat structure with primitive values only
    return { 
      success: false, 
      error_message: errorMessage,
      error_stack: errorStack || null,
      processing_time_ms: elapsedTime
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
