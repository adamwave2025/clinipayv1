
import { supabase } from '@/integrations/supabase/client';
import { NotificationMethod, NotificationResult } from '../../../types/notification';
import { NotificationPayloadData } from '../types';

export const PaymentNotificationService = {
  /**
   * Create a notification payload for sending to the patient
   */
  createNotificationPayload(
    data: NotificationPayloadData,
    notificationMethod: NotificationMethod
  ) {
    // Create the standard notification payload
    return {
      recipient: {
        email: data.patient.email || null,
        phone: data.patient.phone || null,
        name: data.patient.name
      },
      clinic: {
        id: data.clinic.id,
        name: data.clinic.name,
        email: data.clinic.email || null,
        phone: data.clinic.phone || null,
        address: data.clinic.address || null
      },
      payment: {
        reference: data.payment.reference,
        amount: data.payment.amount,
        refund_amount: data.payment.refund_amount || null,
        payment_link: data.payment.payment_link || null,
        message: data.payment.message || null
      },
      notification_method: notificationMethod
    };
  },

  /**
   * Send a notification about a payment
   */
  async sendNotification(
    payload: any,
    clinicId: string,
    paymentReference: string
  ): Promise<NotificationResult> {
    try {
      console.log('⚠️ CRITICAL: Sending payment notification with payload:', payload);
      
      // Add to the notification queue
      const { data, error } = await supabase
        .from('notification_queue')
        .insert({
          type: 'payment_request',
          recipient_type: 'patient',
          clinic_id: clinicId,
          payment_id: paymentReference,
          payload: payload,
          status: 'pending'
        })
        .select();
      
      if (error) {
        console.error('⚠️ CRITICAL ERROR: Failed to queue notification:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
      
      console.log('⚠️ CRITICAL: Notification queued successfully:', data);
      
      return {
        success: true,
        notification_id: data[0]?.id,
        delivery: {
          webhook: true,
          edge_function: true,
          fallback: true,
          any_success: true
        }
      };
    } catch (error: any) {
      console.error('⚠️ CRITICAL ERROR: Failed to send notification:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};
