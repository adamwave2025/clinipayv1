
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
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'client-direct-call',
        'X-Delivery-Method': 'immediate'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚠️ CRITICAL ERROR: Webhook ${endpoint} returned status ${response.status}: ${errorText}`);
      return { 
        success: false, 
        status: response.status, 
        error: errorText 
      };
    }

    console.log('⚠️ CRITICAL SUCCESS: Direct webhook call successful');
    return { success: true };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception calling webhook directly:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}
