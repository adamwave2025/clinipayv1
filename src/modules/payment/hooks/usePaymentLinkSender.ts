
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addToNotificationQueue } from '@/utils/notifications';
import type { 
  NotificationResponse, 
  StandardNotificationPayload 
} from '@/utils/notifications/types';

export function usePaymentLinkSender() {
  const [isSending, setIsSending] = useState(false);

  const sendPaymentLink = async (
    patientData: any,
    paymentLinkId: string,
    paymentAmount: number,
    customMessage?: string
  ) => {
    setIsSending(true);
    try {
      // First get the payment link details
      const { data: linkData, error: linkError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', paymentLinkId)
        .single();
      
      if (linkError || !linkData) {
        throw new Error(linkError?.message || 'Payment link not found');
      }
      
      // Create payment request record
      const { data: requestData, error: requestError } = await supabase
        .from('payment_requests')
        .insert([
          {
            payment_link_id: paymentLinkId,
            patient_id: patientData.id,
            status: 'pending',
            amount: paymentAmount,
            message: customMessage || '',
          },
        ])
        .select()
        .single();
        
      if (requestError || !requestData) {
        throw new Error(requestError?.message || 'Failed to create payment request');
      }
      
      // Create unique payment URL - use id if unique_id doesn't exist
      // In our database structure, we need to use the ID directly
      const paymentUrl = `${window.location.origin}/payment/${linkData.id}`;
      
      // Get clinic details
      const { data: userData } = await supabase.auth.getUser();
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.user?.user_metadata?.clinic_id || '')
        .single();
        
      if (clinicError || !clinicData) {
        console.warn('Could not fetch clinic details for notification');
      }
      
      // Send notification
      const notificationPayload: StandardNotificationPayload = {
        notification_type: 'payment_link_sent',
        notification_method: {
          email: true,
          sms: true,
        },
        patient: {
          name: `${patientData.first_name || patientData.name || 'Patient'}`,
          email: patientData.email,
          phone: patientData.phone,
        },
        payment: {
          reference: linkData.title || 'Payment Request', // Use title instead of name
          amount: paymentAmount,
          payment_link: paymentUrl,
          message: customMessage || linkData.description || '',
        },
        clinic: {
          name: clinicData?.clinic_name || 'Your clinic',
          email: clinicData?.email,
          phone: clinicData?.phone,
          address: clinicData?.address_line_1,
        },
      };
      
      // Fix the call to addToNotificationQueue by providing the right number of arguments
      const notificationResult = await addToNotificationQueue(
        'patient',
        requestData.id,
        notificationPayload,
        'payment_link_sent' // Adding the required notification type parameter
      );
      
      if (!notificationResult.success) {
        console.warn('Notification may not have been sent:', notificationResult.error);
        // Continue anyway, the background process might retry
      }
      
      toast.success('Payment request sent successfully');
      return { success: true, data: requestData };
    } catch (error: any) {
      console.error('Error sending payment link:', error);
      toast.error(`Failed to send payment link: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsSending(false);
    }
  };
  
  return { sendPaymentLink, isSending };
}
