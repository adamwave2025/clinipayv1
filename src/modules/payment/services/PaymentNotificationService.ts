
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';
import { callWebhookDirectly } from '@/utils/webhook-caller';
import { toast } from 'sonner';

/**
 * Service for sending payment notifications directly, bypassing the notification queue
 */
export const PaymentNotificationService = {
  /**
   * Directly send payment notification to webhook without using notification queue
   */
  async sendDirectNotification(
    payload: StandardNotificationPayload,
    recipient_type: 'patient' | 'clinic',
    clinic_id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`⚠️ CRITICAL: Directly calling webhook for ${recipient_type} notification`);
      console.log(`⚠️ CRITICAL: Using clinic_id: ${clinic_id}`);
      
      // Format monetary values (convert from pennies to pounds)
      if (payload.payment && payload.payment.amount) {
        const rawAmount = payload.payment.amount;
        payload.payment.amount = typeof rawAmount === 'number' ? rawAmount / 100 : rawAmount;
        
        if (payload.payment.refund_amount) {
          const rawRefundAmount = payload.payment.refund_amount;
          payload.payment.refund_amount = typeof rawRefundAmount === 'number' ? rawRefundAmount / 100 : rawRefundAmount;
        }
      }
      
      console.log(`⚠️ CRITICAL: Sending notification payload:`, JSON.stringify(payload, null, 2));
      
      // Call webhook directly
      const result = await callWebhookDirectly(payload, recipient_type);
      
      if (!result.success) {
        console.error(`⚠️ CRITICAL ERROR: Failed to send direct webhook notification: ${result.error}`);
        return { success: false, error: result.error };
      }
      
      console.log(`✅ Direct webhook notification sent successfully for ${recipient_type}`);
      return { success: true };
    } catch (error: any) {
      console.error(`⚠️ CRITICAL ERROR: Exception in direct webhook notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Send manual payment notification directly to patient and clinic
   */
  async sendManualPaymentNotifications(
    patientNotification: StandardNotificationPayload,
    clinicNotification: StandardNotificationPayload,
    clinic_id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First send patient notification
      const patientResult = await this.sendDirectNotification(
        patientNotification,
        'patient',
        clinic_id
      );
      
      if (!patientResult.success) {
        console.warn(`⚠️ Failed to send patient notification: ${patientResult.error}`);
        // Continue to send clinic notification even if patient notification fails
      }
      
      // Then send clinic notification
      const clinicResult = await this.sendDirectNotification(
        clinicNotification,
        'clinic',
        clinic_id
      );
      
      if (!clinicResult.success) {
        console.warn(`⚠️ Failed to send clinic notification: ${clinicResult.error}`);
      }
      
      // Consider overall success if either notification was successful
      const success = patientResult.success || clinicResult.success;
      
      if (!success) {
        toast.warning('Payment recorded, but notification delivery might be delayed');
        return { 
          success: false, 
          error: `Failed to send notifications: ${patientResult.error || clinicResult.error}` 
        };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error(`⚠️ CRITICAL ERROR: Exception in manual payment notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};
