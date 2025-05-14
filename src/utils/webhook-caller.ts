
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';

/**
 * Directly call the webhook to send notifications immediately
 */
export async function callWebhookDirectly(
  payload: StandardNotificationPayload, 
  recipientType: 'patient' | 'clinic'
) {
  try {
    console.log(`⚠️ CRITICAL: Calling webhook directly for ${recipientType} notification`);
    
    // The webhook endpoint for notifications
    const webhookUrl = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL || 'https://clinipay.co.uk/api/notifications';
    
    // Add transaction ID for tracing across logs
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Add clinic_id to the top level of the webhook payload for RLS purposes
    const clinicId = payload.clinic?.id;
    if (!clinicId) {
      console.error(`⚠️ CRITICAL ERROR: [${transactionId}] No clinic_id in payload.clinic`, payload.clinic);
    }
    
    // Prepare the webhook payload
    const webhookPayload = {
      payload,
      recipient_type: recipientType,
      transaction_id: transactionId,
      clinic_id: clinicId // Add clinic_id at the top level too
    };
    
    console.log(`⚠️ CRITICAL: [${transactionId}] Sending to webhook URL: ${webhookUrl}`);
    console.log(`⚠️ CRITICAL: [${transactionId}] With payload:`, JSON.stringify(webhookPayload, null, 2));
    
    const startTime = Date.now();
    
    // Make the direct call to the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'direct-client-call',
        'X-Transaction-ID': transactionId
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const requestDuration = Date.now() - startTime;
    console.log(`⚠️ CRITICAL: [${transactionId}] Webhook response received in ${requestDuration}ms with status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚠️ CRITICAL ERROR: [${transactionId}] Webhook call failed with status ${response.status}: ${errorText}`);
      return { 
        success: false, 
        error: `Webhook call failed with status ${response.status}`, 
        details: errorText,
        transactionId 
      };
    }
    
    const responseData = await response.json();
    console.log(`⚠️ CRITICAL SUCCESS: [${transactionId}] Webhook call succeeded with response:`, responseData);
    
    return { 
      success: true, 
      data: responseData,
      transactionId
    };
  } catch (error) {
    console.error(`⚠️ CRITICAL ERROR: Exception during webhook call:`, error);
    return { success: false, error: String(error) };
  }
}
