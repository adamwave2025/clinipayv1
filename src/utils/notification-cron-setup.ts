
import { supabase } from '@/integrations/supabase/client';

/**
 * Trigger immediate processing of the notification queue
 */
export async function processNotificationsNow() {
  console.log('Triggering immediate notification queue processing');
  
  try {
    // First check if we have any pending notifications to process
    const { data: pendingNotifications, error: checkError } = await supabase
      .from('notification_queue')
      .select('id, type')
      .eq('status', 'pending')
      .limit(10);
    
    if (checkError) {
      console.error('Error checking for pending notifications:', checkError);
      return { success: false, error: checkError };
    }
    
    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('No pending notifications found, skipping processing');
      return { success: true, message: 'No pending notifications' };
    }
    
    console.log(`Found ${pendingNotifications.length} pending notifications:`, 
      pendingNotifications.map(n => `${n.id} (${n.type})`));
    
    // Call the process-notification-queue edge function
    try {
      // Ensure we have the function URL from Supabase
      const functionEndpoint = 'https://jbtxxlkhiubuzanegtzn.supabase.co/functions/v1/process-notification-queue';
      console.log('Calling edge function at:', functionEndpoint);
      
      // Get current session - using async getSession instead of deprecated session()
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      // If no authenticated session, use the anon key as fallback
      const authHeader = accessToken 
        ? `Bearer ${accessToken}`
        : 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidHh4bGtoaXVidXphbmVndHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjU3MTIsImV4cCI6MjA1OTcwMTcxMn0.Pe8trGeGMCmJ61zEFbkaPJidKnmxVOWkLExPa-TNn9I';
      
      console.log('Using auth header:', authHeader.substring(0, 20) + '...');
      
      const response = await fetch(functionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ 
          trigger: 'manual',
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Edge function returned status ${response.status}: ${errorText}`);
        return { success: false, error: `Function error: ${response.status} - ${errorText}` };
      }
      
      const result = await response.json();
      console.log('Function execution result:', result);
      
      return { success: true, result };
    } catch (funcError) {
      console.error('Error calling process-notification-queue function:', funcError);
      return { success: false, error: funcError };
    }
  } catch (error) {
    console.error('Error in processNotificationsNow:', error);
    return { success: false, error };
  }
}

/**
 * Set up automatic notification processing via cron
 */
export function setupNotificationCron() {
  // This will be implemented if needed, but for now we're using immediate processing
  console.log('Notification cron setup is not active - using immediate processing');
}
