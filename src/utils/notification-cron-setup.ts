
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Directly call the process-notification-queue Supabase edge function
 * This function is meant to be called when a notification needs immediate delivery
 */
export async function processNotificationsNow() {
  try {
    console.log('⚠️ CRITICAL: Attempting to manually trigger notification processing...');
    
    // Use the Supabase client to invoke the edge function - this handles auth and CORS properly
    const { data, error } = await supabase.functions.invoke('process-notification-queue', {
      method: 'POST',
      body: {
        trigger: 'manual',
        timestamp: new Date().toISOString(),
        source: 'client-immediate'
      }
    });

    if (error) {
      console.error('⚠️ CRITICAL ERROR: Failed to trigger notification processing:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to process notifications' 
      };
    }
    
    console.log('⚠️ CRITICAL SUCCESS: Notification processing triggered successfully:', data);
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Exception in processNotificationsNow:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error triggering notifications' 
    };
  }
}

/**
 * Fallback webhook caller for when the direct Supabase function call fails
 * This creates another path for delivery in case the edge function call fails
 */
export async function triggerNotificationFallback() {
  try {
    // The webhook URL for notification processing - use system-configured URL if available
    const fallbackUrl = 'https://notification-service.clinipay.co.uk/process-queue';
    
    // Make a request to the fallback webhook
    const response = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Process-Source': 'fallback-trigger'
      },
      body: JSON.stringify({
        trigger: 'fallback',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Fallback webhook returned ${response.status}`);
    }
    
    console.log('⚠️ CRITICAL: Fallback notification trigger sent successfully');
    return { success: true };
  } catch (error) {
    console.error('⚠️ CRITICAL ERROR: Failed to trigger fallback webhook:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
