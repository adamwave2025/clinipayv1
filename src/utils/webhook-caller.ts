
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
    
    // Prepare the webhook payload
    const webhookPayload = {
      payload,
      recipient_type: recipientType
    };
    
    console.log(`⚠️ CRITICAL: Sending to webhook URL: ${webhookUrl}`);
    console.log(`⚠️ CRITICAL: With payload:`, JSON.stringify(webhookPayload, null, 2));
    
    // Make the direct call to the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'direct-client-call'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚠️ CRITICAL ERROR: Webhook call failed with status ${response.status}: ${errorText}`);
      return { success: false, error: `Webhook call failed with status ${response.status}` };
    }
    
    const responseData = await response.json();
    console.log(`⚠️ CRITICAL SUCCESS: Webhook call succeeded with response:`, responseData);
    
    return { success: true, data: responseData };
  } catch (error) {
    console.error(`⚠️ CRITICAL ERROR: Exception during webhook call:`, error);
    return { success: false, error: String(error) };
  }
}
