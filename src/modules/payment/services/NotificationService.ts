
import { supabase } from '@/integrations/supabase/client';
import { StandardNotificationPayload, NotificationResult } from '../types/notification';
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
  ): Promise<NotificationResult> {
    console.log(`⚠️ CRITICAL: Adding notification to queue: type=${type}, recipient=${recipient_type}, reference=${reference_id}`);
    console.log(`⚠️ CRITICAL: Using clinic_id=${clinic_id}`);
    console.log(`⚠️ CRITICAL: Payload details:`, JSON.stringify(payload, null, 2));
    
    try {
      // Ensure clinic ID is valid
      if (!clinic_id) {
        console.error('⚠️ CRITICAL ERROR: Missing clinic_id for notification queue insertion');
        return { 
          success: false, 
          error: 'Missing clinic_id',
          delivery: { webhook: false, edge_function: false, fallback: false, any_success: false },
        };
      }
      
      // ENSURE clinic ID is properly set in the payload - this is critical
      // Check if payload has a clinic object, if not create one
      if (!payload.clinic || typeof payload.clinic !== 'object') {
        console.log('⚠️ CRITICAL WARNING: No clinic object in payload, creating one');
        payload.clinic = {
          id: clinic_id,
          name: "Your healthcare provider"
        };
      } else if (!payload.clinic.id) {
        // If clinic exists but no ID, add it
        console.log('⚠️ CRITICAL: Adding clinic_id to payload.clinic');
        payload.clinic.id = clinic_id;
      } else if (payload.clinic.id !== clinic_id) {
        console.warn(`⚠️ CRITICAL WARNING: Different clinic IDs: payload=${payload.clinic.id}, parameter=${clinic_id}`);
        // Use the provided clinic_id to ensure RLS works
        payload.clinic.id = clinic_id;
      }
      
      // Make sure payment includes refund_amount even if it's null
      if (payload.payment && typeof payload.payment === 'object') {
        if (payload.payment.refund_amount === undefined) {
          console.log('⚠️ CRITICAL: Adding refund_amount: null to payment payload');
          payload.payment.refund_amount = null;
        }
      } else {
        console.error('⚠️ CRITICAL ERROR: Payload has no payment object or it is not properly formatted');
        return { 
          success: false, 
          error: 'Invalid payload structure: missing payment object',
          delivery: { webhook: false, edge_function: false, fallback: false, any_success: false },
        };
      }
      
      // Check for clinic_id in multiple places (critical for RLS)
      console.log('⚠️ CRITICAL DEBUG: Payload clinic ID check', {
        'clinic_id_param': clinic_id,
        'payload_clinic_id': payload.clinic?.id,
        'clinic_object_exists': !!payload.clinic,
        'has_payment_message': !!payload.payment?.message,
        'is_payment_plan': payload.payment?.message?.includes('[PLAN]') || false
      });
      
      // Convert the StandardNotificationPayload to Json compatible format
      const jsonPayload = payload as unknown as Json;
      
      console.log('⚠️ CRITICAL: Current auth state:', JSON.stringify({
        isLoggedIn: !!(await supabase.auth.getSession()).data.session,
        clinic_id: clinic_id
      }));
      
      // Insert into notification queue with detailed debugging
      console.log('⚠️ CRITICAL: Attempting to insert notification into queue');
      console.log('⚠️ CRITICAL: Notification data:', JSON.stringify({
        type,
        recipient_type,
        payment_id: payment_id || null,
        status: 'pending',
        retry_count: 0,
        payload: jsonPayload
      }, null, 2));

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
        console.error('⚠️ CRITICAL ERROR: Failed to add to notification queue:', error);
        console.error('⚠️ CRITICAL ERROR: Error details:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        }));
        console.error('⚠️ CRITICAL ERROR: Payload causing error:', JSON.stringify({
          type,
          recipient_type,
          has_payment_id: !!payment_id,
          clinic_id: clinic_id,
          payload_clinic_id: payload.clinic?.id,
          payment_message: payload.payment?.message
        }));
        return { 
          success: false, 
          error,
          delivery: { webhook: false, edge_function: false, fallback: false, any_success: false },
        };
      }

      if (!data || data.length === 0) {
        console.error('⚠️ CRITICAL ERROR: No data returned from notification queue insertion');
        return { 
          success: false, 
          error: 'No data returned',
          delivery: { webhook: false, edge_function: false, fallback: false, any_success: false },
        };
      }

      const queuedItem = data[0];
      console.log(`⚠️ CRITICAL SUCCESS: Successfully queued notification with id: ${queuedItem.id}`);

      // DIRECT WEBHOOK CALL - First delivery attempt
      console.log(`⚠️ CRITICAL: Calling webhook directly...`);
      const webhookResult = await callWebhookDirectly(payload, recipient_type);
      
      // Track delivery method success
      let webhookSuccess = false;
      let edgeFunctionSuccess = false;
      let fallbackSuccess = false;
      
      if (webhookResult.success) {
        console.log(`⚠️ CRITICAL SUCCESS: Direct webhook call successful`);
        webhookSuccess = true;
        
        // Mark notification as sent since direct delivery succeeded
        const { error: updateError } = await supabase
          .from('notification_queue')
          .update({ 
            status: 'sent',
            processed_at: new Date().toISOString()
          })
          .eq('id', queuedItem.id);
        
        if (updateError) {
          console.error('⚠️ CRITICAL: Failed to update notification status:', updateError);
        }
      } else {
        console.error('⚠️ CRITICAL ERROR: Direct webhook call failed:', webhookResult.error);
      }
      
      // If processImmediately is true or direct webhook failed, trigger the notification queue processing
      if (processImmediately || !webhookSuccess) {
        console.log(`⚠️ CRITICAL: ${processImmediately ? 'processImmediately=true' : 'Direct webhook failed'}, triggering edge function...`);
        
        try {
          // EDGE FUNCTION CALL - Second delivery attempt
          const processingResult = await processNotificationsNow();
          console.log(`⚠️ CRITICAL: Edge function result:`, processingResult);
          
          if (processingResult.success) {
            edgeFunctionSuccess = true;
          } else if (!webhookSuccess) {
            // Only try fallback if both primary methods failed
            console.log(`⚠️ CRITICAL: Both direct webhook and edge function failed, trying fallback...`);
            
            // FALLBACK WEBHOOK - Third delivery attempt
            const fallbackResult = await triggerNotificationFallback();
            if (fallbackResult.success) {
              fallbackSuccess = true;
            }
          }
        } catch (procError) {
          console.error('⚠️ CRITICAL ERROR: Failed to trigger notification processing:', procError);
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
        },
        immediate_processing: processImmediately
      };
    } catch (error: any) {
      console.error('⚠️ CRITICAL ERROR: Exception adding to notification queue:', error);
      return { 
        success: false, 
        error: error.message,
        delivery: { webhook: false, edge_function: false, fallback: false, any_success: false },
        errors: { webhook: error.message }
      };
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
