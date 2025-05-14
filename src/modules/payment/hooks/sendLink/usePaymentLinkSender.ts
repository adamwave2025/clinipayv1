
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
}

export function usePaymentLinkSender() {
  const [isLoading, setIsLoading] = useState(false);

  const sendPaymentLink = async ({ formData, clinicId }: PaymentLinkSenderProps) => {
    setIsLoading(true);
    console.log('Starting payment link creation process...');
    
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
          .select('amount')
          .eq('id', paymentLinkId)
          .single();
          
        if (linkError || !linkData) {
          console.error('Error fetching payment link details:', linkError);
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

      // Check if we need to create a patient first
      let patientId = null;
      
      // Look for existing patient with this email
      if (formData.patientEmail) {
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('email', formData.patientEmail)
          .maybeSingle();
          
        if (existingPatient) {
          patientId = existingPatient.id;
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
            console.error('Error creating patient:', patientError);
            // Continue without patient ID
          } else if (newPatient) {
            patientId = newPatient.id;
          }
        }
      }

      // Create the payment request using only fields that exist in the database
      console.log('Creating payment request with:', {
        clinic_id: clinicId,
        patient_id: patientId,
        payment_link_id: paymentLinkId,
        custom_amount: paymentLinkId ? null : amount,
        patient_name: formData.patientName,
        patient_email: formData.patientEmail,
        patient_phone: formData.patientPhone,
        status: 'sent',
        message: formData.message || null
      });
      
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: clinicId,
          patient_id: patientId,
          payment_link_id: paymentLinkId,
          custom_amount: paymentLinkId ? null : amount, // Use custom_amount instead of amount
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone || null,
          status: 'sent',
          message: formData.message || null
        })
        .select();

      if (error) {
        console.error('Error creating payment request:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create payment request');
      }

      toast.success('Payment link sent successfully');
      return { success: true, paymentRequestId: data[0].id };
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
