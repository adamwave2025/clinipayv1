
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';
import { processNotificationsNow } from '@/utils/notification-cron-setup';
import { addToNotificationQueue } from '@/utils/notification-queue';

interface PaymentLinkSenderProps {
  formData: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    selectedLink: string;
    customAmount: string;
    message: string;
  };
  paymentLinks: any[];
}

export function usePaymentLinkSender() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const sendPaymentLink = async ({ formData, paymentLinks }: PaymentLinkSenderProps) => {
    setIsLoading(true);
    console.log('Starting payment link creation process...');
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user?.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      if (!userData.clinic_id) {
        console.error('No clinic_id found for user:', user?.id);
        throw new Error('No clinic associated with this user');
      }
      
      console.log('Found clinic_id:', userData.clinic_id);

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.clinic_id)
        .single();

      if (clinicError) {
        console.error('Error fetching clinic data:', clinicError);
        throw clinicError;
      }
      
      console.log('Retrieved clinic data successfully');

      let amount = 0;
      let paymentLinkId = null;
      let paymentTitle = '';

      if (formData.selectedLink) {
        const selectedPaymentLink = paymentLinks.find(link => link.id === formData.selectedLink);
        if (selectedPaymentLink) {
          amount = selectedPaymentLink.amount;
          paymentLinkId = selectedPaymentLink.id;
          paymentTitle = selectedPaymentLink.title;
          console.log('Using payment link:', { id: paymentLinkId, title: paymentTitle, amount });
        } else {
          console.error('Selected payment link not found in available links');
        }
      } else if (formData.customAmount) {
        amount = Number(formData.customAmount);
        console.log('Using custom amount:', amount);
      }

      console.log('Creating payment request with:', {
        clinicId: userData.clinic_id,
        paymentLinkId,
        amount,
        patientName: formData.patientName
      });

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: userData.clinic_id,
          payment_link_id: paymentLinkId,
          custom_amount: formData.selectedLink ? null : amount,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone ? formData.patientPhone.replace(/\D/g, '') : null,
          status: 'sent',
          message: formData.message || null
        })
        .select();

      if (error) {
        console.error('Error creating payment request:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('No data returned from payment request creation');
        throw new Error('Failed to create payment request');
      }

      const paymentRequest = data[0];
      console.log('Payment request created successfully:', paymentRequest);
      
      const notificationMethod: NotificationMethod = {
        email: !!formData.patientEmail,
        sms: !!formData.patientPhone
      };

      const formattedAddress = ClinicFormatter.formatAddress(clinicData);
      
      if (notificationMethod.email || notificationMethod.sms) {
        console.log('Creating notification for payment request');
        
        const notificationPayload: StandardNotificationPayload = {
          notification_type: "payment_request",
          notification_method: notificationMethod,
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
          },
          clinic: {
            name: clinicData.clinic_name || "Your healthcare provider",
            email: clinicData.email,
            phone: clinicData.phone,
            address: formattedAddress
          }
        };

        console.log('Notification payload prepared:', JSON.stringify(notificationPayload, null, 2));

        try {
          const { success, error } = await addToNotificationQueue(
            'payment_request',
            notificationPayload,
            'patient',
            userData.clinic_id,
            paymentRequest.id
          );

          if (!success) {
            console.error("Failed to queue notification:", error);
            toast.warning("Payment link was sent, but notification delivery might be delayed");
          } else {
            console.log("Payment request notification queued successfully");
            
            try {
              console.log("Processing notifications immediately...");
              const processResult = await processNotificationsNow();
              console.log("Process notifications result:", processResult);
            } catch (cronErr) {
              console.error("Exception triggering notification processing:", cronErr);
            }
          }
        } catch (notifyErr) {
          console.error("Critical error during notification queueing:", notifyErr);
        }
      } else {
        console.warn('No notification methods available for this patient');
      }
      
      toast.success('Payment link sent successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error sending payment link:', error);
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
