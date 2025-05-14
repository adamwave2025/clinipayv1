
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/modules/payment/services'; 
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';

interface PaymentLinkSenderProps {
  formData: {
    patientName: string;
    patientEmail: string;
    patientPhone?: string;
    selectedLink: string;
    customAmount?: string;
    message?: string;
  };
  clinicId: string;
  patientId?: string;  // Optional patient ID
}

export function usePaymentLinkSender() {
  const [isLoading, setIsLoading] = useState(false);

  const sendPaymentLink = async ({ formData, clinicId, patientId }: PaymentLinkSenderProps) => {
    setIsLoading(true);
    console.log('⚠️ CRITICAL: Starting payment link creation process...');
    
    try {
      if (!clinicId) {
        throw new Error('No clinic ID provided');
      }
      
      // Calculate the amount to charge
      let amount = 0;
      let paymentLinkId = null;
      
      if (formData.selectedLink) {
        paymentLinkId = formData.selectedLink;
        
        // Fetch the link details to get the amount
        const { data: linkData, error: linkError } = await supabase
          .from('payment_links')
          .select('amount, title, payment_plan')
          .eq('id', paymentLinkId)
          .single();
          
        if (linkError || !linkData) {
          console.error('⚠️ CRITICAL ERROR: Error fetching payment link details:', linkError);
          throw new Error('Could not find the selected payment link');
        }
        
        amount = linkData.amount;
      } else if (formData.customAmount) {
        amount = parseInt(formData.customAmount, 10);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Invalid custom amount');
        }
      } else {
        throw new Error('Either a payment link ID or custom amount must be provided');
      }

      // Use provided patientId or find/create one
      let finalPatientId = patientId; 
      
      // Check if we need to create a patient first
      if (!finalPatientId) {
        // Look for existing patient with this email
        if (formData.patientEmail) {
          const { data: existingPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('clinic_id', clinicId)
            .eq('email', formData.patientEmail)
            .maybeSingle();
            
          if (existingPatient) {
            finalPatientId = existingPatient.id;
          } else {
            // Create a new patient if not found
            const { data: newPatient, error: patientError } = await supabase
              .from('patients')
              .insert({
                clinic_id: clinicId,
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
            }
          }
        }
      }

      // Create the payment request
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: clinicId,
          patient_id: finalPatientId,
          payment_link_id: paymentLinkId,
          custom_amount: paymentLinkId ? null : amount,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone || null,
          status: 'sent',
          message: formData.message || null
        })
        .select();

      if (error) {
        console.error('⚠️ CRITICAL ERROR: Error creating payment request:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create payment request');
      }

      const paymentRequest = data[0];
      console.log('⚠️ CRITICAL: Payment request created successfully:', paymentRequest.id);

      // Get clinic data for the notification
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (clinicError || !clinicData) {
        console.error('⚠️ CRITICAL ERROR: Error fetching clinic data:', clinicError);
        throw new Error('Could not find clinic information');
      }

      // Determine notification methods
      const notificationMethod: NotificationMethod = {
        email: !!formData.patientEmail,
        sms: !!formData.patientPhone
      };

      const formattedAddress = ClinicFormatter.formatAddress(clinicData);
      
      // Create notification payload
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
          message: formData.message || "Payment request"
        },
        clinic: {
          id: clinicId,
          name: clinicData.clinic_name || "Your healthcare provider",
          email: clinicData.email,
          phone: clinicData.phone,
          address: formattedAddress
        }
      };

      // Queue notification with processImmediately=true to ensure immediate delivery
      const notificationResult = await NotificationService.addToQueue(
        'payment_request',
        notificationPayload,
        'patient',
        clinicId,
        paymentRequest.id,
        undefined,
        true  // Set processImmediately=true ALWAYS for payment links
      );
      
      if (!notificationResult.success) {
        console.error('⚠️ CRITICAL ERROR: Failed to queue notification:', notificationResult.error);
        // Continue - the payment request was created successfully
        toast.warning("Payment link created, but notification delivery might be delayed");
      } else if (notificationResult.delivery?.any_success === false) {
        console.warn('⚠️ CRITICAL WARNING: Notification queued but immediate delivery failed');
        toast.info("Payment link created, notification will be delivered shortly");
      } else {
        console.log('⚠️ CRITICAL SUCCESS: Notification delivery succeeded');
      }

      return { 
        success: true, 
        paymentRequestId: paymentRequest.id,
        notificationSent: notificationResult.success && notificationResult.delivery?.any_success
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
