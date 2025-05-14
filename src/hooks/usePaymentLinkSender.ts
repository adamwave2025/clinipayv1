
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';
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
  patientId?: string; // Add optional patientId
}

export function usePaymentLinkSender() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const sendPaymentLink = async ({ formData, paymentLinks, patientId }: PaymentLinkSenderProps) => {
    setIsLoading(true);
    console.log('⚠️ CRITICAL: Starting payment link creation process...');
    console.log('⚠️ CRITICAL: With user:', user?.id);
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user?.id)
        .single();

      if (userError) {
        console.error('⚠️ CRITICAL ERROR: Error fetching user data:', userError);
        throw userError;
      }
      
      if (!userData.clinic_id) {
        console.error('⚠️ CRITICAL ERROR: No clinic_id found for user:', user?.id);
        throw new Error('No clinic associated with this user');
      }
      
      console.log('⚠️ CRITICAL: Found clinic_id:', userData.clinic_id);

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.clinic_id)
        .single();

      if (clinicError) {
        console.error('⚠️ CRITICAL ERROR: Error fetching clinic data:', clinicError);
        throw clinicError;
      }
      
      console.log('⚠️ CRITICAL: Retrieved clinic data successfully:', clinicData.clinic_name);

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
        amount = Number(formData.customAmount);
        console.log('⚠️ CRITICAL: Using custom amount:', amount);
      }

      // Use provided patientId or find/create one
      let finalPatientId = patientId;
      
      if (!finalPatientId) {
        // Look for existing patient with this email
        if (formData.patientEmail) {
          const { data: existingPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('clinic_id', userData.clinic_id)
            .eq('email', formData.patientEmail)
            .maybeSingle();
            
          if (existingPatient) {
            finalPatientId = existingPatient.id;
            console.log('⚠️ CRITICAL: Found existing patient:', finalPatientId);
          } else {
            // Create a new patient if not found
            const { data: newPatient, error: patientError } = await supabase
              .from('patients')
              .insert({
                clinic_id: userData.clinic_id,
                name: formData.patientName,
                email: formData.patientEmail,
                phone: formData.patientPhone || null
              })
              .select()
              .single();
              
            if (patientError) {
              console.error('⚠️ CRITICAL ERROR: Error creating patient:', patientError);
              // Continue without patient ID
            } else if (newPatient) {
              finalPatientId = newPatient.id;
              console.log('⚠️ CRITICAL: Created new patient:', finalPatientId);
            }
          }
        }
      } else {
        console.log('⚠️ CRITICAL: Using provided patient ID:', finalPatientId);
      }

      console.log('⚠️ CRITICAL: Creating payment request with:', {
        clinicId: userData.clinic_id,
        patientId: finalPatientId,
        paymentLinkId,
        amount,
        patientName: formData.patientName,
        isPaymentPlan,
        message: formData.message || null
      });

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: userData.clinic_id,
          patient_id: finalPatientId,
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
        console.error('⚠️ CRITICAL ERROR: Error creating payment request:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('⚠️ CRITICAL ERROR: No data returned from payment request creation');
        throw new Error('Failed to create payment request');
      }

      const paymentRequest = data[0];
      console.log('⚠️ CRITICAL: Payment request created successfully:', paymentRequest.id);
      
      const notificationMethod: NotificationMethod = {
        email: !!formData.patientEmail,
        sms: !!formData.patientPhone
      };

      const formattedAddress = ClinicFormatter.formatAddress(clinicData);
      
      if (notificationMethod.email || notificationMethod.sms) {
        console.log('⚠️ CRITICAL: Creating notification for payment request');
        console.log('⚠️ CRITICAL: Notification methods:', JSON.stringify({
          email: notificationMethod.email ? formData.patientEmail : "none",
          sms: notificationMethod.sms ? formData.patientPhone : "none"
        }));
        
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
            id: userData.clinic_id, // Explicitly include clinic_id in payload
            name: clinicData.clinic_name || "Your healthcare provider",
            email: clinicData.email,
            phone: clinicData.phone,
            address: formattedAddress
          }
        };

        console.log('⚠️ CRITICAL: Notification payload prepared:', JSON.stringify(notificationPayload, null, 2));
        
        // Add a debug flag to the payload for payment plans
        if (isPaymentPlan) {
          console.log('⚠️ CRITICAL: This is a payment plan - adding debug flag to payload');
          notificationPayload.payment.message = `[PLAN] ${notificationPayload.payment.message}`;
        }

        try {
          console.log('⚠️ CRITICAL: Adding notification to queue and calling webhook directly...');
          console.log('⚠️ CRITICAL: With clinic_id:', userData.clinic_id);
          
          // This is a reusable link - use processImmediately=true to ensure immediate delivery
          const notificationResult = await addToNotificationQueue(
            'payment_request',
            notificationPayload,
            'patient',
            userData.clinic_id,
            paymentRequest.id,
            undefined,  // payment_id is undefined
            true  // processImmediately = true for reusable links
          );

          if (!notificationResult.success) {
            console.error("⚠️ CRITICAL ERROR: Failed to queue notification:", notificationResult.error);
            toast.warning("Payment link was sent, but notification delivery might be delayed");
          } else if (notificationResult.delivery?.any_success === false) {
            console.error("⚠️ CRITICAL ERROR: Failed to deliver notification via webhook:", notificationResult.errors?.webhook);
            toast.warning("Payment link was sent, but notification delivery might be delayed");
          } else {
            console.log("⚠️ CRITICAL SUCCESS: Payment request notification sent successfully");
          }
        } catch (notifyErr) {
          console.error("⚠️ CRITICAL ERROR: Exception during notification delivery:", notifyErr);
          toast.warning("Payment link created, but there was an issue sending notifications");
        }
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

  return {
    isLoading,
    sendPaymentLink
  };
}
