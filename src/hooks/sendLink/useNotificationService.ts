
import { useState } from 'react';
import { toast } from 'sonner';
import { addToNotificationQueue } from '@/utils/notification-queue';
import { NotificationMethod, StandardNotificationPayload } from '@/types/notification';
import { NotificationPayloadData } from './types';

// Define the notification result type to match what's expected
export interface NotificationResult {
  success: boolean;
  delivery?: {
    webhook: boolean;
    edge_function: boolean;
    fallback: boolean;
    any_success: boolean;
  };
  errors?: {
    webhook?: string;
  };
  notification_id?: string;
  error?: string;
}

export function useNotificationService() {
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const createNotificationPayload = (
    recipientData: NotificationPayloadData,
    notificationMethod: NotificationMethod
  ): StandardNotificationPayload => {
    return {
      notification_type: "payment_request",
      notification_method: notificationMethod,
      patient: recipientData.patient,
      payment: recipientData.payment,
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
      console.log('⚠️ CRITICAL: Adding notification to queue and calling webhook directly...');
      console.log('⚠️ CRITICAL: With clinic_id:', clinicId);
      
      // Use processImmediately=true to ensure immediate delivery
      const notificationResult = await addToNotificationQueue(
        'payment_request',
        payload,
        'patient',
        clinicId,
        paymentRequestId,
        undefined,  // payment_id is undefined
        true  // processImmediately = true
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
        error: error.message
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
