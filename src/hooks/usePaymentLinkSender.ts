
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationMethod } from '@/types/notification';
import { PaymentLinkSenderProps, PaymentLinkSenderResult } from './sendLink/types';
import { useClinicDataService } from './sendLink/useClinicDataService';
import { usePatientOperations } from './sendLink/usePatientOperations';
import { usePaymentRequestService } from './sendLink/usePaymentRequestService';
import { useNotificationService } from './sendLink/useNotificationService';
import { poundsToPence } from '@/services/CurrencyService';

export function usePaymentLinkSender() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const clinicService = useClinicDataService();
  const patientOperations = usePatientOperations();
  const paymentRequestService = usePaymentRequestService();
  const notificationService = useNotificationService();

  const sendPaymentLink = async ({ formData, paymentLinks, patientId }: PaymentLinkSenderProps): Promise<PaymentLinkSenderResult> => {
    setIsLoading(true);
    console.log('⚠️ CRITICAL: Starting payment link creation process...');
    console.log('⚠️ CRITICAL: With user:', user?.id);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Step 1: Get clinic ID for the current user
      const clinicId = await clinicService.fetchUserClinicId(user.id);
      
      // Step 2: Get detailed clinic data
      const clinicData = await clinicService.fetchClinicData(clinicId);
      
      // Step 3: Determine payment amount and link ID
      let amount = 0;
      let paymentLinkId = null;
      let paymentTitle = '';
      let isPaymentPlan = false;

      if (formData.selectedLink) {
        const selectedPaymentLink = paymentLinks.find(link => link.id === formData.selectedLink);
        if (selectedPaymentLink) {
          amount = selectedPaymentLink.amount;
          paymentLinkId = selectedPaymentLink.id;
          paymentTitle = selectedPaymentLink.title;
          isPaymentPlan = selectedPaymentLink.paymentPlan || false;
          console.log('⚠️ CRITICAL: Using payment link:', { 
            id: paymentLinkId, 
            title: paymentTitle, 
            amount,
            isPaymentPlan 
          });
        } else {
          console.error('⚠️ CRITICAL ERROR: Selected payment link not found in available links');
        }
      } else if (formData.customAmount) {
        // FIXED: Convert custom amount from pounds to pence
        amount = poundsToPence(formData.customAmount);
        console.log('⚠️ CRITICAL: Using custom amount:', formData.customAmount, 'pounds ->', amount, 'pence');
      }

      // Step 4: Find or create patient
      const finalPatientId = await patientOperations.findOrCreatePatient(
        formData, 
        clinicId, 
        patientId
      );

      // Step 5: Create the payment request
      const paymentRequest = await paymentRequestService.createPaymentRequest(
        clinicId,
        finalPatientId,
        formData,
        paymentLinkId,
        formData.selectedLink ? null : amount
      );
      
      // Step 6: Determine notification methods and send notifications
      const notificationMethod: NotificationMethod = {
        email: !!formData.patientEmail,
        sms: !!formData.patientPhone
      };

      const formattedAddress = clinicService.formatClinicAddress(clinicData);
      
      if (notificationMethod.email || notificationMethod.sms) {
        console.log('⚠️ CRITICAL: Creating notification for payment request');
        console.log('⚠️ CRITICAL: Notification methods:', JSON.stringify({
          email: notificationMethod.email ? formData.patientEmail : "none",
          sms: notificationMethod.sms ? formData.patientPhone : "none"
        }));
        
        const notificationPayload = notificationService.createNotificationPayload({
          clinic: {
            id: clinicId,
            name: clinicData.clinic_name || "Your healthcare provider",
            email: clinicData.email,
            phone: clinicData.phone,
            address: formattedAddress
          },
          patient: {
            name: formData.patientName,
            email: formData.patientEmail,
            phone: formData.patientPhone
          },
          payment: {
            reference: paymentRequest.id,
            amount: amount,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment/${paymentRequest.id}`,
            message: formData.message || (paymentTitle ? `Payment for ${paymentTitle}` : "Payment request")
          }
        }, notificationMethod);

        // Add a debug flag to the payload for payment plans
        if (isPaymentPlan) {
          console.log('⚠️ CRITICAL: This is a payment plan - adding debug flag to payload');
          notificationPayload.payment.message = `[PLAN] ${notificationPayload.payment.message}`;
        }

        // Send the notification
        await notificationService.sendPaymentNotification(
          notificationPayload,
          clinicId,
          paymentRequest.id
        );
      } else {
        console.warn('⚠️ CRITICAL: No notification methods available for this patient');
      }
      
      toast.success('Payment link sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('⚠️ CRITICAL ERROR: Error sending payment link:', error);
      toast.error('Failed to send payment link: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total loading state from all sub-services
  const isSubServiceLoading = 
    clinicService.isFetchingClinic || 
    patientOperations.isProcessingPatient || 
    paymentRequestService.isCreatingPaymentRequest || 
    notificationService.isSendingNotification;

  return {
    isLoading: isLoading || isSubServiceLoading,
    sendPaymentLink
  };
}
