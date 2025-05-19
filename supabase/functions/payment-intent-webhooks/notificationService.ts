
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Service responsible for queuing notifications
 */
export class NotificationService {
  /**
   * Queue notifications for a refund
   * @param supabase Supabase client
   * @param payment Payment data
   * @param refundAmount The refund amount (in pence/cents)
   * @param isRawValue Flag indicating if monetary values should be passed as raw pence values
   */
  static async queueRefundNotifications(supabase: any, payment: any, refundAmount: number, isRawValue: boolean = false) {
    try {
      console.log(`Queueing refund notification for payment: ${payment.id}, refund amount: ${refundAmount}p, isRawValue: ${isRawValue}`);
      
      if (!payment) {
        console.error("No payment data provided for refund notification");
        return;
      }
      
      const isFullRefund = refundAmount >= payment.amount_paid;
      console.log(`Full refund check: ${refundAmount} >= ${payment.amount_paid} = ${isFullRefund}`);
      
      // Fetch clinic data
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", payment.clinic_id)
        .maybeSingle();
      
      if (clinicError) {
        console.error("Error fetching clinic data for refund notification:", clinicError);
      }
      
      const notifications = [];
      
      // Create patient notification if we have contact info
      if (payment.patient_email || payment.patient_phone) {
        // Create refund notification payload
        const patientPayload = {
          notification_type: "payment_refund",
          notification_method: {
            email: !!payment.patient_email,
            sms: !!payment.patient_phone
          },
          patient: {
            name: payment.patient_name || 'Patient',
            email: payment.patient_email,
            phone: payment.patient_phone
          },
          payment: {
            reference: payment.payment_ref || "N/A",
            amount: payment.amount_paid, // Raw amount in pence
            refund_amount: refundAmount, // Raw amount in pence
            payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
            message: isFullRefund ? "Your payment has been fully refunded" : "Your payment has been partially refunded",
            is_full_refund: isFullRefund
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          },
          // Add flag indicating these are raw monetary values in pence
          monetary_values_in_pence: isRawValue
        };
        
        const patientNotification = {
          type: "payment_refund",
          payload: patientPayload,
          payment_id: payment.id,
          recipient_type: "patient"
        };
        
        notifications.push(patientNotification);
      }
      
      // Create clinic notification
      if (clinicData) {
        // Create clinic notification payload
        const clinicPayload = {
          notification_type: "payment_refund",
          notification_method: {
            email: clinicData?.email_notifications ?? true,
            sms: clinicData?.sms_notifications ?? true
          },
          patient: {
            name: payment.patient_name || 'Patient',
            email: payment.patient_email,
            phone: payment.patient_phone
          },
          payment: {
            reference: payment.payment_ref || "N/A",
            amount: payment.amount_paid, // Raw amount in pence
            refund_amount: refundAmount, // Raw amount in pence
            payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
            message: isFullRefund ? "Full payment refund processed" : "Partial payment refund processed",
            is_full_refund: isFullRefund,
            financial_details: {
              gross_amount: payment.amount_paid, // Raw amount in pence
              stripe_fee: payment.stripe_fee || 0, // Raw amount in pence
              platform_fee: payment.platform_fee || 0, // Raw amount in pence
              net_amount: payment.net_amount || 0, // Raw amount in pence
              refund_fee: payment.stripe_refund_fee || 0 // Raw amount in cents
            }
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your clinic',
            email: clinicData?.email,
            phone: clinicData?.phone
          },
          // Add flag indicating these are raw monetary values in pence
          monetary_values_in_pence: isRawValue
        };
        
        const clinicNotification = {
          type: "payment_refund",
          payload: clinicPayload,
          payment_id: payment.id,
          recipient_type: "clinic"
        };
        
        notifications.push(clinicNotification);
      }
      
      // Insert all notifications into the notification queue
      if (notifications.length > 0) {
        const { data, error } = await supabase
          .from("notification_queue")
          .insert(notifications);
        
        if (error) {
          console.error("Error inserting refund notifications into queue:", error);
          return { success: false, error };
        }
        
        console.log(`Successfully queued ${notifications.length} refund notifications`);
        return { success: true, count: notifications.length };
      } else {
        console.log("No refund notifications to queue");
        return { success: true, count: 0 };
      }
    } catch (error) {
      console.error("Error queueing refund notifications:", error);
      return { success: false, error };
    }
  }
}
