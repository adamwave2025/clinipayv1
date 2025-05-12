
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addToNotificationQueue, checkNotificationExists } from '@/utils/notification-queue';
import { StandardNotificationPayload } from '@/types/notification';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';
import { verifyWebhookConfiguration } from '@/utils/webhook-caller';

/**
 * Sends a payment reminder for a specific installment
 * @returns An object with success status and optional error
 */
export const sendPaymentReminder = async (installmentId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('🔔 Sending payment reminder for installment:', installmentId);
    
    // First verify webhook configuration
    console.log('🔍 Verifying webhook configuration before proceeding...');
    const webhookConfig = await verifyWebhookConfiguration();
    if (!webhookConfig.patient) {
      console.warn('⚠️ Patient webhook is not configured! The reminder might not be delivered properly.');
      toast.warning('Notification system is not fully configured. Contact support if reminders are not being delivered.');
    }
    
    // Get installment details with expanded data
    const { data: installment, error: installmentError } = await supabase
      .from('payment_schedule')
      .select(`
        id,
        plan_id,
        patient_id,
        clinic_id,
        payment_link_id,
        amount,
        payment_frequency,
        due_date,
        payment_request_id,
        payment_number,
        total_payments,
        payment_requests (
          id,
          patient_name,
          patient_email,
          patient_phone,
          message
        ),
        plans (
          title,
          description
        )
      `)
      .eq('id', installmentId)
      .single();
    
    if (installmentError) {
      console.error('❌ Error fetching installment details:', installmentError);
      toast.error('Failed to send payment reminder');
      return { success: false, error: installmentError };
    }
    
    if (!installment.payment_request_id) {
      // Create a new payment request for this installment
      toast.error('This installment doesn\'t have a payment request yet. Please create one first.');
      return { success: false, error: 'No payment request for this installment' };
    }

    // Check if a reminder notification has already been sent for this payment request
    const notificationExists = await checkNotificationExists('payment_reminder', 'patient', installment.payment_request_id);
    if (notificationExists) {
      console.warn(`⚠️ A reminder notification already exists for payment request ${installment.payment_request_id}, skipping`);
      toast.info('A reminder has already been sent for this payment');
      return { success: true };
    }

    // Get clinic details for the notification
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', installment.clinic_id)
      .single();

    if (clinicError) {
      console.error('❌ Error fetching clinic data:', clinicError);
      toast.error('Failed to send payment reminder: Could not get clinic details');
      return { success: false, error: clinicError };
    }

    // Prepare notification payload
    const patientName = installment.payment_requests?.patient_name || 'Patient';
    const patientEmail = installment.payment_requests?.patient_email;
    const patientPhone = installment.payment_requests?.patient_phone;
    const planTitle = installment.plans?.title || 'Payment Plan';
    const planDescription = installment.plans?.description || '';
    
    const notificationMethod = {
      email: !!patientEmail,
      sms: !!patientPhone
    };
    
    if (!notificationMethod.email && !notificationMethod.sms) {
      toast.error('Cannot send reminder: No email or phone number available for this patient');
      return { success: false, error: 'No contact methods available' };
    }
    
    const formattedAddress = ClinicFormatter.formatAddress(clinicData);
    
    // Create a reminder-specific message
    const reminderMessage = `REMINDER: ${installment.payment_requests?.message || `Payment plan: ${planTitle} - Installment ${installment.payment_number} of ${installment.total_payments}`}`;
    
    const notificationPayload: StandardNotificationPayload = {
      notification_type: "payment_request",
      notification_method: notificationMethod,
      patient: {
        name: patientName,
        email: patientEmail,
        phone: patientPhone
      },
      payment: {
        reference: installment.payment_request_id,
        amount: installment.amount,
        refund_amount: null,
        payment_link: `https://clinipay.co.uk/payment/${installment.payment_request_id}`,
        message: reminderMessage
      },
      clinic: {
        name: clinicData.clinic_name || "Your healthcare provider",
        email: clinicData.email,
        phone: clinicData.phone,
        address: formattedAddress
      }
    };
    
    console.log('⚠️ CRITICAL: Payment reminder notification payload prepared:', JSON.stringify(notificationPayload, null, 2));
    
    // Add to notification queue with immediate processing
    try {
      const { success, error, notification_id, webhook_success, webhook_error } = await addToNotificationQueue(
        'payment_reminder',
        notificationPayload,
        'patient',
        installment.clinic_id,
        installment.payment_request_id
      );

      if (!success) {
        console.error('❌ Failed to queue payment reminder:', error);
        toast.error('Failed to send payment reminder');
        return { success: false, error };
      } else if (!webhook_success) {
        console.error('⚠️ Failed to deliver reminder via webhook:', webhook_error);
        toast.warning('Payment reminder was queued but delivery might be delayed');
        return { success: true, error: webhook_error };
      }
      
      console.log('✅ Successfully added payment reminder to notification queue with ID:', notification_id);
      
      // Add activity record for the reminder
      await supabase
        .from('payment_activity')
        .insert({
          clinic_id: installment.clinic_id,
          patient_id: installment.patient_id,
          payment_link_id: installment.payment_link_id,
          plan_id: installment.plan_id,
          action_type: 'payment_reminder_sent',
          details: {
            payment_schedule_id: installment.id,
            payment_request_id: installment.payment_request_id,
            due_date: installment.due_date,
            payment_number: installment.payment_number
          }
        });
      
      toast.success('Payment reminder sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending payment reminder:', error);
      toast.error('Failed to send payment reminder');
      return { success: false, error };
    }
  } catch (error) {
    console.error('❌ Error in sendPaymentReminder:', error);
    toast.error('Failed to send payment reminder');
    return { success: false, error };
  }
}
