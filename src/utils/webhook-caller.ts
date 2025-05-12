
import { StandardNotificationPayload } from '@/types/notification';

// Default webhook URL for services integration
const DEFAULT_WEBHOOK_URL = 'https://services.leadconnector.com/payment/webhook';

/**
 * Directly call webhook with notification payload
 */
export async function callWebhookDirectly(
  payload: StandardNotificationPayload,
  recipient_type: 'patient' | 'clinic'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('⚠️ CRITICAL: Calling webhook directly with payload:', JSON.stringify(payload, null, 2));
    
    // Format monetary values to display as currency (convert pennies to pounds)
    if (payload.payment && payload.payment.amount) {
      console.log('💰 Converting monetary values to proper format');
      // Convert amount from pennies to pounds
      const rawAmount = payload.payment.amount;
      payload.payment.amount = typeof rawAmount === 'number' ? rawAmount / 100 : rawAmount;
      
      // Also convert refund amount if present
      if (payload.payment.refund_amount) {
        const rawRefundAmount = payload.payment.refund_amount;
        payload.payment.refund_amount = typeof rawRefundAmount === 'number' ? rawRefundAmount / 100 : rawRefundAmount;
      }
    }

    // Use default webhook URL
    const webhookUrl = DEFAULT_WEBHOOK_URL;
    
    console.log(`📤 Sending notification to webhook: ${webhookUrl}`);

    // Make direct HTTP call to webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚠️ CRITICAL ERROR: Webhook call failed with status ${response.status}: ${errorText}`);
      return { success: false, error: `Webhook responded with ${response.status}: ${errorText}` };
    }

    console.log(`✅ Webhook response: ${response.status}`);
    return { success: true };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception in webhook call:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error calling webhook' };
  }
}
