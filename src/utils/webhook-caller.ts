

import { StandardNotificationPayload } from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';

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

    // Determine which webhook URL to use based on recipient_type
    let webhookUrl: string | null = null;
    
    // First try to get webhook URL from system_settings
    const { data: webhookSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', recipient_type === 'patient' ? 'patient_notification_webhook' : 'clinic_notification_webhook')
      .maybeSingle();
      
    if (!settingsError && webhookSettings?.value) {
      webhookUrl = webhookSettings.value;
      console.log(`📤 Found webhook URL in system_settings for ${recipient_type} notifications`);
    } else {
      console.log(`⚠️ No webhook URL found in system_settings for ${recipient_type} notifications, trying environment fallback`);
    }
    
    // If no webhook URL in system_settings, use default service domain
    if (!webhookUrl) {
      // Default fallback to Lead Connector standard webhook
      webhookUrl = 'https://services.leadconnector.com/payment/webhook';
      console.log(`📤 Using default webhook URL: ${webhookUrl}`);
    }
    
    console.log(`📤 Sending ${recipient_type} notification to webhook: ${webhookUrl}`);

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
