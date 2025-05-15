
import { useState } from 'react';
import { toast } from 'sonner';
import { NotificationMethod } from '@/types/notification';
import { NotificationPayloadData } from './types';
import { PaymentNotificationService } from '@/modules/payment/hooks/sendLink/services';
import { StandardNotificationPayload, NotificationResult } from '@/modules/payment/types/notification';

export function useNotificationService() {
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const createNotificationPayload = (
    recipientData: NotificationPayloadData,
    notificationMethod: NotificationMethod
  ): StandardNotificationPayload => {
    console.log('⚠️ CRITICAL: Creating notification payload with data:', JSON.stringify({
      clinic_id: recipientData.clinic.id,
      clinic_name: recipientData.clinic.name,
      patient_name: recipientData.patient.name,
      ref: recipientData.payment.reference,
      payment_type: recipientData.payment.message?.includes('[PLAN]') ? 'PLAN' : 'REGULAR'
    }, null, 2));
    
    // Ensure clinic.id is present and consistent
    if (!recipientData.clinic.id) {
      console.error('⚠️ CRITICAL ERROR: Missing clinic.id in notification payload data');
    }
    
    // Ensure refund_amount is always provided as null
    return {
      notification_type: "payment_request",
      notification_method: notificationMethod,
      patient: recipientData.patient,
      payment: {
        reference: recipientData.payment.reference,
        amount: recipientData.payment.amount,
        refund_amount: null, // Always provide this field as null
        payment_link: recipientData.payment.payment_link,
        message: recipientData.payment.message
      },
      clinic: recipientData.clinic
    };
  };

  const sendPaymentNotification = async (
    payload: StandardNotificationPayload,
    clinicId: string,
    paymentRequestId: string
  ): Promise<NotificationResult> => {
    setIsSendingNotification(true);
    
    try {
      console.log('⚠️ CRITICAL: Sending payment notification through service...');
      console.log('⚠️ CRITICAL: Using clinicId:', clinicId);
      console.log('⚠️ CRITICAL: Is payment plan:', payload.payment.message?.includes('[PLAN]') ? 'YES' : 'NO');
      
      // Ensure clinic ID is properly set in payload before sending
      if (!payload.clinic || !payload.clinic.id) {
        console.warn('⚠️ CRITICAL WARNING: clinic_id missing in payload, adding it now');
        if (!payload.clinic) {
          payload.clinic = { id: clinicId, name: "Your healthcare provider" };
        } else {
          payload.clinic.id = clinicId;
        }
      } else if (payload.clinic.id !== clinicId) {
        console.warn(`⚠️ CRITICAL WARNING: Mismatched clinic IDs - payload: ${payload.clinic.id}, parameter: ${clinicId}`);
        payload.clinic.id = clinicId;
      }
      
      const notificationResult = await PaymentNotificationService.sendNotification(
        payload,
        clinicId,
        paymentRequestId
      );

      if (!notificationResult.success) {
        console.error("⚠️ CRITICAL ERROR: Failed to queue notification:", notificationResult.error);
        toast.warning("Payment link was sent, but notification delivery might be delayed");
        return notificationResult;
      } else if (notificationResult.delivery?.any_success === false) {
        console.error("⚠️ CRITICAL ERROR: Failed to deliver notification via webhook:", notificationResult.errors?.webhook);
        toast.warning("Payment link was sent, but notification delivery might be delayed");
        return notificationResult;
      } else {
        console.log("⚠️ CRITICAL SUCCESS: Payment request notification sent successfully");
        return notificationResult;
      }
    } catch (error: any) {
      console.error("⚠️ CRITICAL ERROR: Exception during notification delivery:", error);
      toast.warning("Payment link created, but there was an issue sending notifications");
      return {
        success: false,
        error: error.message,
        delivery: { webhook: false, edge_function: false, fallback: false, any_success: false },
        errors: { webhook: error.message }
      };
    } finally {
      setIsSendingNotification(false);
    }
  };

  return {
    isSendingNotification,
    createNotificationPayload,
    sendPaymentNotification
  };
}

export type { NotificationResult };
