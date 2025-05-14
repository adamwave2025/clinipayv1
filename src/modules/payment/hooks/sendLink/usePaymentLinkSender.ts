
import { useState } from 'react';
import { toast } from 'sonner';
import { NotificationMethod } from '../../types/notification';
import { PaymentLinkSenderProps, PaymentLinkSenderResult } from './types';
import {
  PatientService,
  PaymentRequestService,
  ClinicService,
  NotificationService,
  PaymentLinkService
} from './services';

export function usePaymentLinkSender() {
  const [isLoading, setIsLoading] = useState(false);

  const sendPaymentLink = async ({ formData, clinicId, patientId }: PaymentLinkSenderProps): Promise<PaymentLinkSenderResult> => {
    setIsLoading(true);
    console.log('⚠️ CRITICAL: Starting payment link creation process...');
    
    try {
      if (!clinicId) {
        throw new Error('No clinic ID provided');
      }
      
      // Calculate the amount to charge
      let amount = 0;
      let paymentLinkId = null;
      let title = '';
      let isPaymentPlan = false;
      
      if (formData.selectedLink) {
        paymentLinkId = formData.selectedLink;
        
        // Fetch the link details to get the amount
        const linkData = await PaymentLinkService.fetchPaymentLinkDetails(paymentLinkId);
        
        amount = linkData.amount;
        title = linkData.title || '';
        isPaymentPlan = linkData.payment_plan || false;
      } else if (formData.customAmount) {
        amount = parseInt(formData.customAmount, 10);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid custom amount');
        }
      } else {
        throw new Error('Either a payment link ID or custom amount must be provided');
      }

      // Use provided patientId or find/create one
      const finalPatientId = await PatientService.findOrCreatePatient(
        formData.patientName,
        formData.patientEmail,
        formData.patientPhone,
        clinicId,
        patientId
      );

      // Create the payment request
      const paymentRequest = await PaymentRequestService.createPaymentRequest(
        clinicId,
        finalPatientId,
        formData.patientName,
        formData.patientEmail,
        formData.patientPhone,
        paymentLinkId,
        paymentLinkId ? null : amount,
        formData.message
      );

      // Get clinic data for the notification
      const clinicData = await ClinicService.fetchClinicData(clinicId);
      const formattedAddress = ClinicService.formatClinicAddress(clinicData);

      // Determine notification methods
      const notificationMethod: NotificationMethod = {
        email: !!formData.patientEmail,
        sms: !!formData.patientPhone
      };
      
      let notificationSent = false;
      
      if (notificationMethod.email || notificationMethod.sms) {
        // Create notification payload
        const notificationPayload = NotificationService.createNotificationPayload(
          clinicId,
          clinicData.clinic_name,
          clinicData.email,
          clinicData.phone,
          formattedAddress,
          formData.patientName,
          formData.patientEmail,
          formData.patientPhone,
          paymentRequest.id,
          amount,
          formData.message || (title ? `Payment for ${title}` : "Payment request"),
          notificationMethod
        );

        // Add a debug flag to the payload for payment plans
        if (isPaymentPlan) {
          console.log('⚠️ CRITICAL: This is a payment plan - adding debug flag to payload');
          notificationPayload.payment.message = `[PLAN] ${notificationPayload.payment.message}`;
        }

        // Send notification
        const notificationResult = await NotificationService.sendNotification(
          notificationPayload,
          clinicId,
          paymentRequest.id
        );
        
        notificationSent = notificationResult.success && (notificationResult.delivery?.any_success || false);
        
        if (!notificationResult.success) {
          toast.warning("Payment link created, but notification delivery might be delayed");
        } else if (notificationResult.delivery?.any_success === false) {
          toast.info("Payment link created, notification will be delivered shortly");
        }
      } else {
        console.warn('⚠️ CRITICAL WARNING: No notification methods available for this patient');
      }

      toast.success('Payment link sent successfully');
      return { 
        success: true, 
        paymentRequestId: paymentRequest.id,
        notificationSent 
      };
    } catch (error: any) {
      console.error('⚠️ CRITICAL ERROR: Error sending payment link:', error);
      toast.error('Failed to send payment link: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sendPaymentLink
  };
}
