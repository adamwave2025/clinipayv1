
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload } from '../types/notification';
import { Json } from '@/integrations/supabase/types';
import { callWebhookDirectly } from '@/utils/webhook-caller';
import { processNotificationsNow, triggerNotificationFallback } from '@/utils/notification-cron-setup';

/**
 * Service for managing notifications throughout the payment system
 */
export class NotificationService {
  /**
   * Add an item to the notification queue for processing
   */
  static async addToQueue(
    type: string,
    payload: StandardNotificationPayload,
    recipient_type: 'patient' | 'clinic',
    clinic_id: string,
    reference_id?: string,
    payment_id?: string,
    processImmediately = false
  ) {
    console.log(`⚠️ CRITICAL: Adding notification to queue: type=${type}, recipient=${recipient_type}, reference=${reference_id}`);
    console.log(`⚠️ CRITICAL: Using clinic_id=${clinic_id}`);
    
    try {
      // Ensure clinic ID is valid
      if (!clinic_id) {
        console.error('⚠️ CRITICAL ERROR: Missing clinic_id for notification queue');
        return { success: false, error: 'Missing clinic_id' };
      }
      
      // Ensure clinic ID is in payload for RLS purposes
      if (payload.clinic && typeof payload.clinic === 'object') {
        if (!payload.clinic.id) {
          payload.clinic.id = clinic_id;
        } else if (payload.clinic.id !== clinic_id) {
          payload.clinic.id = clinic_id; // Ensure consistent clinic ID
        }
      } else {
        return { success: false, error: 'Invalid payload structure: missing clinic object' };
      }
      
      // Convert payload to JSON format
      const jsonPayload = payload as unknown as Json;
      
      // Insert into notification queue
      const { data, error } = await supabase
        .from('notification_queue')
        .insert({
          type,
          payload: jsonPayload,
          recipient_type,
          ...(payment_id ? { payment_id } : {}),
          status: 'pending',
          retry_count: 0
        })
        .select();

      if (error) {
        console.error('⚠️ CRITICAL ERROR: Failed to add to queue:', error);
        return { success: false, error };
      }

      const queuedItem = data?.[0];
      if (!queuedItem) {
        return { success: false, error: 'No data returned' };
      }

      // First attempt: Direct webhook call
      const webhookResult = await callWebhookDirectly(payload, recipient_type);
      
      // Track delivery success
      let webhookSuccess = false;
      let edgeFunctionSuccess = false;
      let fallbackSuccess = false;
      
      if (webhookResult.success) {
        webhookSuccess = true;
        await this.markNotificationSent(queuedItem.id);
      }
      
      // Second attempt: Edge function (if immediate processing needed or webhook failed)
      if (processImmediately || !webhookSuccess) {
        try {
          const processingResult = await processNotificationsNow();
          
          if (processingResult.success) {
            edgeFunctionSuccess = true;
          } else if (!webhookSuccess) {
            // Third attempt: Fallback webhook
            const fallbackResult = await triggerNotificationFallback();
            fallbackSuccess = fallbackResult.success;
          }
        } catch (err) {
          console.error('⚠️ CRITICAL ERROR: Failed to process notifications:', err);
        }
      }
      
      return { 
        success: true, 
        notification_id: queuedItem.id, 
        delivery: {
          webhook: webhookSuccess,
          edge_function: edgeFunctionSuccess,
          fallback: fallbackSuccess,
          any_success: webhookSuccess || edgeFunctionSuccess || fallbackSuccess
        },
        errors: {
          webhook: !webhookSuccess ? webhookResult.error : undefined
        }
      };
    } catch (error) {
      console.error('⚠️ CRITICAL ERROR: Exception adding to queue:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Mark a notification as sent
   */
  private static async markNotificationSent(notificationId: string) {
    const { error } = await supabase
      .from('notification_queue')
      .update({ 
        status: 'sent',
        processed_at: new Date().toISOString() 
      })
      .eq('id', notificationId);
      
    if (error) {
      console.error('⚠️ CRITICAL: Failed to update notification status:', error);
    }
  }
}
