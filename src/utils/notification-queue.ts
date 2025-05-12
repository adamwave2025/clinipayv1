
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '@/types/notification';
import { Json } from '@/integrations/supabase/types';
import { formatUserInputCurrency } from '@/utils/formatters';

/**
 * Ensure all monetary values in the notification payload have proper decimal formatting
 * This is critical for email/SMS templates to show amounts like £1000.00 instead of £1000 or £100000
 */
const formatMonetaryValues = (payload: StandardNotificationPayload): StandardNotificationPayload => {
  const formattedPayload = { ...payload };
  
  // Format payment amount if it exists
  if (formattedPayload.payment) {
    const payment = formattedPayload.payment;
    
    // Ensure payment amount has 2 decimal places
    if (payment.amount !== undefined) {
      // The amount should already be in pounds, but we ensure proper formatting
      console.log(`Formatting payment amount ${payment.amount} for notification`);
      const amountNumber = typeof payment.amount === 'string' 
        ? parseFloat(payment.amount) 
        : payment.amount;
      
      if (!isNaN(amountNumber)) {
        payment.amount = Number(amountNumber.toFixed(2));
      }
    }
    
    // Ensure refund amount has 2 decimal places if it exists
    if (payment.refund_amount !== undefined && payment.refund_amount !== null) {
      console.log(`Formatting refund amount ${payment.refund_amount} for notification`);
      const refundNumber = typeof payment.refund_amount === 'string' 
        ? parseFloat(payment.refund_amount) 
        : payment.refund_amount;
      
      if (!isNaN(refundNumber)) {
        payment.refund_amount = Number(refundNumber.toFixed(2));
      }
    }
    
    // Format financial details if they exist
    if (payment.financial_details) {
      const financials = payment.financial_details;
      
      // Ensure each financial value has 2 decimal places
      for (const key of ['gross_amount', 'stripe_fee', 'platform_fee', 'net_amount', 'refund_fee']) {
        if (financials[key] !== undefined) {
          console.log(`Formatting ${key}: ${financials[key]} for notification`);
          const value = typeof financials[key] === 'string' 
            ? parseFloat(financials[key]) 
            : financials[key];
          
          if (!isNaN(value)) {
            financials[key] = Number(value.toFixed(2));
          }
        }
      }
    }
  }
  
  return formattedPayload;
};

/**
 * Utility function to add a notification to the queue with better error handling
 */
export async function addToNotificationQueue(
  type: string, 
  payload: StandardNotificationPayload, 
  recipientType: string, 
  clinicId: string,
  paymentId?: string
) {
  console.log(`Adding ${recipientType} notification to queue: ${type}`, payload);
  console.log(`Using clinic_id: ${clinicId}`);
  
  try {
    // Ensure monetary values in the payload have proper decimal formatting
    const formattedPayload = formatMonetaryValues(payload);
    console.log(`Payload structure with formatted monetary values:`, JSON.stringify(formattedPayload, null, 2));
    
    // Check if system webhooks are configured 
    console.log('Checking if notification webhooks are configured...');
    const { data: webhooks, error: webhookError } = await supabase
      .from('system_settings')
      .select('*')
      .in('key', ['patient_notification_webhook', 'clinic_notification_webhook']);
    
    if (webhookError) {
      console.error('Error checking webhook configuration:', webhookError);
      return { success: false, error: webhookError };
    } else {
      if (!webhooks || webhooks.length < 2) {
        console.warn('Notification webhooks not fully configured in system_settings:');
        console.log('Found webhooks:', webhooks);
        return { success: false, error: 'Notification webhooks not fully configured' };
      } else {
        console.log('Notification webhooks are configured correctly:', webhooks.map(w => w.key));
        
        // Log the webhook URLs for debugging (value contains the URL)
        for (const webhook of webhooks) {
          console.log(`${webhook.key}: ${webhook.value ? 'Set' : 'Not set'}`);
        }
      }
    }
    
    // Log permission check for notification_queue table
    console.log('Checking notification_queue table access...');
    try {
      const { data: permissionCheck, error: permissionError } = await supabase
        .from('notification_queue')
        .select('id')
        .limit(1);
      
      if (permissionError) {
        console.error('Permission check failed for notification_queue table:', permissionError);
        return { success: false, error: permissionError };
      } else {
        console.log('Successfully accessed notification_queue table, permissions OK');
      }
    } catch (permErr) {
      console.error('Exception during permission check:', permErr);
      return { success: false, error: permErr };
    }
    
    // Add clinic_id to the payload itself instead of as a separate column
    // This ensures it's available for RLS policies that check payload->>'clinic_id'
    const enrichedPayload = {
      ...formattedPayload,
      clinic_id: clinicId // Add clinic_id to the payload JSON
    };
    
    console.log('Final payload with clinic_id:', JSON.stringify(enrichedPayload, null, 2));
    
    // Add to notification queue - properly convert to Json type
    console.log('Attempting to insert notification...');
    const insertResult = await supabase
      .from("notification_queue")
      .insert({
        type,
        payload: enrichedPayload as unknown as Json,
        recipient_type: recipientType,
        payment_id: paymentId,
        status: 'pending'
      })
      .select();

    if (insertResult.error) {
      console.error("Error queueing notification:", insertResult.error);
      console.error("Error details:", JSON.stringify(insertResult.error, null, 2));
      
      // Check if this is a permissions issue
      if (insertResult.error.code === 'PGRST301' || insertResult.error.message?.includes('permission denied')) {
        console.error("This appears to be a permissions error - check RLS policies");
      }
      
      return { success: false, error: insertResult.error };
    }

    console.log(`${recipientType} notification queued successfully:`, insertResult.data);
    return { success: true, data: insertResult.data };
  } catch (err: any) {
    console.error("Critical error during notification queueing:", err);
    return { success: false, error: err.message };
  }
}
