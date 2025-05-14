
import { useState } from 'react';
import { NotificationMethod } from '@/types/notification';

// Define the notification payload type for better type safety
export interface NotificationPayload {
  notification_type: string;
  notification_method: NotificationMethod;
  clinic: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  patient: {
    name: string;
    email?: string;
    phone?: string;
  };
  payment: {
    reference: string | null; // Can be null when sending a payment request
    amount: number;
    refund_amount: number | null;
    payment_link: string;
    message: string;
  };
}

export interface NotificationResult {
  success: boolean;
  error?: string;
  delivery?: {
    email_sent?: boolean;
    sms_sent?: boolean;
    any_success?: boolean;
  };
  errors?: {
    webhook?: string;
    email?: string;
    sms?: string;
  };
}

export const useNotificationService = () => {
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  
  /**
   * Creates a notification payload object for payment requests
   */
  const createNotificationPayload = (
    recipients: {
      clinic: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        address?: string;
      };
      patient: {
        name: string;
        email?: string;
        phone?: string;
      };
      payment: {
        reference: string;
        amount: number;
        refund_amount: number | null;
        payment_link: string;
        message: string;
      };
    },
    notificationMethod: NotificationMethod
  ): NotificationPayload => {
    return {
      notification_type: "payment_request",
      notification_method: notificationMethod,
      clinic: recipients.clinic,
      patient: recipients.patient,
      payment: {
        // Important: Set reference to null when sending a payment link
        // The reference will be set when the actual payment is made
        reference: null,  
        amount: recipients.payment.amount,
        refund_amount: recipients.payment.refund_amount,
        payment_link: recipients.payment.payment_link,
        message: recipients.payment.message
      }
    };
  };

  /**
   * Sends a payment notification to the patient
   */
  const sendPaymentNotification = async (
    payload: NotificationPayload,
    clinicId: string,
    paymentRequestId: string
  ): Promise<NotificationResult> => {
    setIsSendingNotification(true);
    try {
      // Make API call to send notification
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload,
          clinicId,
          paymentRequestId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to send notification'
        };
      }
      
      const result = await response.json();
      return {
        success: true,
        delivery: result.delivery
      };
    } catch (error: any) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsSendingNotification(false);
    }
  };
  
  return {
    createNotificationPayload,
    sendPaymentNotification,
    isSendingNotification
  };
};
