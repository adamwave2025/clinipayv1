
import { StandardNotificationPayload, NotificationMethod } from '../../../types/notification';
import { NotificationService as CoreNotificationService } from '../../../services';
import { NotificationResult } from '../types';

export const NotificationService = {
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
    return {
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
        refund_amount: null,
        payment_link: `https://clinipay.co.uk/payment/${paymentRequestId}`,
        message: message || "Payment request"
      },
      clinic: {
        id: clinicId,
        name: clinicName || "Your healthcare provider",
        email: clinicEmail,
        phone: clinicPhone,
        address: clinicAddress
      }
    };
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
      console.log('⚠️ CRITICAL: Adding notification to queue and calling webhook directly...');
      console.log('⚠️ CRITICAL: With clinic_id:', clinicId);
      
      // Use processImmediately=true to ensure immediate delivery
      const notificationResult = await CoreNotificationService.addToQueue(
        'payment_request',
        notificationPayload,
        'patient',
        clinicId,
        paymentRequestId,
        undefined,  // payment_id is undefined
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
        error: error.message
      };
    }
  }
};
