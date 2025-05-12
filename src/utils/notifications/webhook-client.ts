
import { StandardNotificationPayload } from '@/types/notification';
import { supabase } from '@/integrations/supabase/client';
import { PrimitiveJsonObject } from './types';
import { Json } from '@/integrations/supabase/types';

/**
 * Directly call webhook with notification payload
 */
export async function callWebhookDirectly(
  payload: StandardNotificationPayload,
  recipient_type: 'patient' | 'clinic'
): Promise<{ success: boolean; error?: string; details?: Record<string, any> }> {
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
      console.log(`📤 Found webhook URL in system_settings for ${recipient_type} notifications: ${webhookUrl}`);
    } else {
      console.log(`⚠️ No webhook URL found in system_settings for ${recipient_type} notifications: ${settingsError?.message || 'No data'}, trying environment fallback`);
    }
    
    // If no webhook URL in system_settings, check the environment variable
    if (!webhookUrl) {
      const envKey = recipient_type === 'patient' ? 'PATIENT_NOTIFICATION' : 'CLINIC_NOTIFICATION';
      console.log(`🔑 Looking for environment variable: ${envKey}`);
      
      // Try to get from Supabase secrets
      try {
        const { data: secretData, error: secretError } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', envKey)
          .maybeSingle();
          
        if (!secretError && secretData?.value) {
          webhookUrl = secretData.value;
          console.log(`🔐 Found webhook URL in secrets for ${recipient_type} notifications: ${webhookUrl.substring(0, 20)}...`);
        } else {
          console.log(`⚠️ No webhook URL found in secrets for ${recipient_type}: ${secretError?.message || 'No data'}`);
        }
      } catch (secretFetchError) {
        console.error(`⚠️ Error fetching secret: ${envKey}`, secretFetchError);
      }
    }
    
    // If still no webhook URL, use default service domain as fallback
    if (!webhookUrl) {
      // Default fallback to Lead Connector standard webhook
      webhookUrl = 'https://services.leadconnector.com/payment/webhook';
      console.log(`📤 Using default webhook URL as last resort: ${webhookUrl}`);
    }
    
    if (!webhookUrl || webhookUrl.trim() === '') {
      throw new Error(`No valid webhook URL found for ${recipient_type} notifications`);
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
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText.substring(0, 255), // Limit string length
        webhook: webhookUrl.substring(0, 255), // Limit string length
        recipientType: recipient_type
      };
      console.error(`⚠️ CRITICAL ERROR: Webhook call failed:`, JSON.stringify(errorDetails, null, 2));
      return { 
        success: false, 
        error: `Webhook responded with ${response.status}: ${errorText.substring(0, 255)}`, // Limit string length
        details: errorDetails 
      };
    }

    // Try to get response body for additional logging
    let responseBody;
    try {
      responseBody = await response.text();
      console.log(`✅ Webhook response body: ${responseBody}`);
    } catch (responseBodyError) {
      console.log('⚠️ Could not retrieve response body, but webhook call was successful');
    }

    console.log(`✅ Webhook call succeeded with status: ${response.status}`);
    return { 
      success: true, 
      details: { 
        status: response.status, 
        responseBody: responseBody ? responseBody.substring(0, 255) : undefined // Limit string length
      } 
    };
  } catch (error) {
    // Enhance error reporting but ensure we only use simple types
    const errorMessage = error instanceof Error ? error.message.substring(0, 255) : 'Unknown error calling webhook';
    const errorStack = error instanceof Error ? error.stack?.substring(0, 255) : undefined;
    
    console.error('⚠️ CRITICAL ERROR: Exception in webhook call:', errorMessage);
    if (errorStack) console.error('Error stack:', errorStack);
    
    return { 
      success: false, 
      error: errorMessage,
      details: {
        stack: errorStack,
        recipientType: recipient_type,
        payloadType: payload.notification_type
      }
    };
  }
}

/**
 * Check if webhook URLs are properly configured in system_settings
 * Returns a status object indicating which webhooks are configured
 */
export async function verifyWebhookConfiguration(): Promise<{
  patient: boolean;
  clinic: boolean;
  patientUrl?: string;
  clinicUrl?: string;
}> {
  const result = {
    patient: false,
    clinic: false,
    patientUrl: undefined,
    clinicUrl: undefined
  };
  
  try {
    console.log('🔍 Verifying webhook configuration...');
    
    // Check patient webhook
    const { data: patientWebhook } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'patient_notification_webhook')
      .maybeSingle();
      
    if (patientWebhook?.value && typeof patientWebhook.value === 'string' && patientWebhook.value.trim() !== '') {
      result.patient = true;
      result.patientUrl = patientWebhook.value;
      console.log('✓ Patient webhook URL is configured');
    } else {
      console.log('✗ Patient webhook URL is not configured');
    }
    
    // Check clinic webhook
    const { data: clinicWebhook } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'clinic_notification_webhook')
      .maybeSingle();
      
    if (clinicWebhook?.value && typeof clinicWebhook.value === 'string' && clinicWebhook.value.trim() !== '') {
      result.clinic = true;
      result.clinicUrl = clinicWebhook.value;
      console.log('✓ Clinic webhook URL is configured');
    } else {
      console.log('✗ Clinic webhook URL is not configured');
    }
    
    console.log('🔍 Webhook verification complete:', result);
    return result;
  } catch (error) {
    console.error('⚠️ Error verifying webhook configuration:', error);
    return result;
  }
}
