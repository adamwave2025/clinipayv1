
import { StandardNotificationPayload } from '@/types/notification';

/**
 * Call webhook directly from client-side code
 * This is a direct delivery method used in parallel with the queue
 */
export async function callWebhookDirectly(
  payload: StandardNotificationPayload, 
  recipient_type: 'patient' | 'clinic'
) {
  const endpoint = recipient_type === 'patient' 
    ? 'https://notification-service.clinipay.co.uk/patient-notifications'
    : 'https://notification-service.clinipay.co.uk/clinic-notifications';
  
  console.log(`⚠️ CRITICAL: Directly calling ${recipient_type} webhook`);
  console.log(`⚠️ CRITICAL: Webhook URL: ${endpoint}`);
  console.log(`⚠️ CRITICAL: Payload: ${JSON.stringify(payload)}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'client-direct-call',
        'X-Delivery-Method': 'immediate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      },
      body: JSON.stringify(payload)
    });

    // Get response as text first to properly log any error messages
    const responseText = await response.text();
    console.log(`⚠️ CRITICAL: Webhook response status: ${response.status}`);
    console.log(`⚠️ CRITICAL: Webhook response: ${responseText}`);

    if (!response.ok) {
      console.error(`⚠️ CRITICAL ERROR: Webhook ${endpoint} returned status ${response.status}: ${responseText}`);
      return { 
        success: false, 
        status: response.status, 
        error: responseText 
      };
    }

    console.log('⚠️ CRITICAL SUCCESS: Direct webhook call successful');
    return { success: true };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception calling webhook directly:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error',
      details: JSON.stringify(error)
    };
  }
}
