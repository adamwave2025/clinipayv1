
import { NotificationPayload, RecipientType, WebhookResult } from './types';
import { isValidNotificationPayload } from './validators';

/**
 * Sends a notification via webhook
 * 
 * @param payload The notification payload
 * @param recipient_type The type of recipient (patient or clinic)
 * @returns Promise with webhook result
 */
export async function callWebhookDirectly(
  payload: any, // Using any to break the type dependency chain
  recipient_type: RecipientType
): Promise<WebhookResult> {
  // Validate payload before processing
  if (!isValidNotificationPayload(payload)) {
    console.error('Invalid notification payload for webhook:', payload);
    return {
      success: false,
      error: 'Invalid payload structure',
      status_code: 400
    };
  }
  
  // This is currently using the stub implementation, but in future could be replaced
  // with a real webhook call. For now, we'll just log and return success.
  console.log(`[WebhookService] Sending ${recipient_type} notification with payload:`, 
    JSON.stringify(payload, null, 2));
  
  // Simulate a successful webhook call
  return {
    success: true,
    status_code: 200,
    response_body: JSON.stringify({ message: 'Notification processed successfully' })
  };
}

/**
 * Verifies webhook configuration
 * 
 * @returns Object indicating whether webhooks are configured for different recipient types
 */
export async function verifyWebhookConfiguration(): Promise<{
  patient: boolean;
  clinic: boolean;
}> {
  // In a real implementation, this would check if webhooks are properly configured
  // For now, we'll return fixed values
  return {
    patient: true,
    clinic: true
  };
}
