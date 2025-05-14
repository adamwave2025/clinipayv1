
/**
 * Try to trigger the notification processing Edge Function
 * This is a fallback mechanism to ensure notifications are processed immediately
 */
export async function processNotificationsNow() {
  try {
    console.log('⚠️ CRITICAL: Attempting to manually trigger notification processing...');
    
    // The URL to the edge function that processes notifications
    const processUrl = import.meta.env.VITE_NOTIFICATION_PROCESS_URL || 'https://clinipay.co.uk/api/process-notifications';
    
    // Make a request to trigger notification processing
    const response = await fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Process-Source': 'manual-client-trigger'
      },
      body: JSON.stringify({
        trigger: 'manual',
        immediate: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚠️ CRITICAL: Failed to trigger notification processing: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }
    
    const data = await response.json();
    console.log('⚠️ CRITICAL SUCCESS: Successfully triggered notification processing', data);
    return { success: true, data };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception triggering notification processing:', error);
    return { success: false, error };
  }
}
