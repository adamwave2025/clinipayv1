
import { StandardNotificationPayload, NotificationMethod, NotificationResult } from '../../../types/notification';
import { NotificationService } from '../../../services';

export const PaymentNotificationService = {
  /**
   * Create a notification payload from recipient data and notification method
   */
  createNotificationPayload(
    clinicId: string,
    clinicName: string,
    clinicEmail: string | undefined,
    clinicPhone: string | undefined,
    clinicAddress: string | undefined,
    patientName: string,
    patientEmail: string | undefined,
    patientPhone: string | undefined,
    paymentRequestId: string,
    amount: number,
    message: string | null,
    notificationMethod: NotificationMethod
  ): StandardNotificationPayload {
    // Create the standard notification payload ensuring all required fields are present
    const payload: StandardNotificationPayload = {
      notification_type: "payment_request",
      notification_method: notificationMethod,
      patient: {
        name: patientName,
        email: patientEmail,
        phone: patientPhone
      },
      payment: {
        reference: paymentRequestId,
        amount: amount,
        refund_amount: null, // Ensure this is always provided as null
        payment_link: `https://clinipay.co.uk/payment/${paymentRequestId}`,
        message: message || "Payment request"
      },
      clinic: {
        id: clinicId, // Always ensure clinic_id is set correctly here
        name: clinicName || "Your healthcare provider",
        email: clinicEmail,
        phone: clinicPhone,
        address: clinicAddress
      }
    };
    
    // Debug logging specific to payment plans
    if (message && message.includes('[PLAN]')) {
      console.log('⚠️ CRITICAL: Creating notification for PAYMENT PLAN');
      console.log('⚠️ CRITICAL: PLAN payload clinic_id check:', payload.clinic.id);
      console.log('⚠️ CRITICAL: Full PLAN payload:', JSON.stringify(payload, null, 2));
    }
    
    return payload;
  },

  /**
   * Send a payment notification
   */
  async sendNotification(
    notificationPayload: StandardNotificationPayload,
    clinicId: string,
    paymentRequestId: string
  ): Promise<NotificationResult> {
    try {
      // Additional logging specifically for payment plans
      if (notificationPayload.payment?.message?.includes('[PLAN]')) {
        console.log('⚠️ CRITICAL: Sending PAYMENT PLAN notification');
        console.log('⚠️ CRITICAL: PLAN clinic_id from parameters:', clinicId);
        console.log('⚠️ CRITICAL: PLAN clinic_id from payload:', notificationPayload.clinic?.id);
      } else {
        console.log('⚠️ CRITICAL: Sending regular payment notification');
      }
      
      console.log('⚠️ CRITICAL: With clinic_id:', clinicId);
      console.log('⚠️ CRITICAL: Reference ID:', paymentRequestId);
      
      // Double check that clinic ID is properly set in the payload
      if (notificationPayload.clinic && typeof notificationPayload.clinic === 'object') {
        if (notificationPayload.clinic.id !== clinicId) {
          console.warn(`⚠️ CRITICAL WARNING: Fixing mismatched clinic IDs - payload: ${notificationPayload.clinic.id}, parameter: ${clinicId}`);
          notificationPayload.clinic.id = clinicId;
        }
      } else if (!notificationPayload.clinic) {
        console.warn('⚠️ CRITICAL WARNING: Payload missing clinic object, adding it now');
        notificationPayload.clinic = {
          id: clinicId,
          name: "Your healthcare provider"
        };
      }
      
      // Use processImmediately=true to ensure immediate delivery
      const notificationResult = await NotificationService.addToQueue(
        'payment_request',
        notificationPayload,
        'patient',
        clinicId, // Ensure clinicId is passed correctly
        paymentRequestId,
        undefined,
        true  // processImmediately = true
      );

      if (!notificationResult.success) {
        console.error("⚠️ CRITICAL ERROR: Failed to queue notification:", notificationResult.error);
      } else if (notificationResult.delivery?.any_success === false) {
        console.error("⚠️ CRITICAL ERROR: Failed to deliver notification via webhook:", notificationResult.errors?.webhook);
      } else {
        console.log("⚠️ CRITICAL SUCCESS: Payment request notification sent successfully");
      }
      
      return notificationResult;
    } catch (error: any) {
      console.error("⚠️ CRITICAL ERROR: Exception during notification delivery:", error);
      return {
        success: false,
        error: error.message,
        delivery: { webhook: false, edge_function: false, fallback: false, any_success: false },
        errors: { webhook: error.message }
      };
    }
  }
};
