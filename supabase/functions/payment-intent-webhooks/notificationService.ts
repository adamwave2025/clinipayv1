
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Service responsible for queueing notifications about payment events
 */
export class NotificationService {
  /**
   * Queue notifications for a successful payment
   */
  static async queuePaymentSuccessNotifications(
    supabaseClient: any,
    paymentId: string,
    paymentData: {
      payment_ref: string;
      amount_paid: number;
      patient_name?: string;
      patient_email?: string;
      patient_phone?: string;
      clinic_id: string;
    },
    financialDetails: {
      stripeFeeInCents: number;
      platformFeeInCents: number;
      netAmountInCents: number;
    }
  ) {
    try {
      // Get clinic data for notifications
      const { data: clinicData, error: clinicError } = await supabaseClient
        .from('clinics')
        .select('*')
        .eq('id', paymentData.clinic_id)
        .single();
        
      if (clinicError) {
        console.error("Error fetching clinic data:", clinicError);
        console.error("Continuing without clinic data");
      }
      
      // Queue patient notification for successful payment if we have contact details
      if (paymentData.patient_email || paymentData.patient_phone) {
        try {
          // Create notification payload for patient with new structure
          const patientPayload = {
            notification_type: "payment_success",
            notification_method: {
              email: !!paymentData.patient_email,
              sms: !!paymentData.patient_phone
            },
            patient: {
              name: paymentData.patient_name || 'Patient',
              email: paymentData.patient_email,
              phone: paymentData.patient_phone
            },
            payment: {
              reference: paymentData.payment_ref,
              amount: paymentData.amount_paid, // Store as integer (cents)
              refund_amount: null,
              payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
              message: "Your payment was successful"
            },
            clinic: {
              name: clinicData?.clinic_name || 'Your healthcare provider',
              email: clinicData?.email,
              phone: clinicData?.phone
            }
          };
          
          // Add to notification queue for patient
          const { error: notifyError } = await supabaseClient
            .from("notification_queue")
            .insert({
              type: 'payment_success',
              payload: patientPayload,
              payment_id: paymentId,
              recipient_type: 'patient'
            });
            
          if (notifyError) {
            console.error(`Error queueing patient notification: ${notifyError.message}`);
            console.error("Error details:", JSON.stringify(notifyError));
          } else {
            console.log(`Successfully queued payment success notification for patient`);
          }
          
          // Queue clinic notification as well
          const clinicPayload = {
            notification_type: "payment_success",
            notification_method: {
              email: clinicData?.email_notifications ?? true,
              sms: clinicData?.sms_notifications ?? true
            },
            patient: {
              name: paymentData.patient_name || 'Anonymous',
              email: paymentData.patient_email,
              phone: paymentData.patient_phone
            },
            payment: {
              reference: paymentData.payment_ref,
              amount: paymentData.amount_paid, // Store as integer (cents)
              refund_amount: null,
              payment_link: `https://clinipay.co.uk/payment-receipt/${paymentId}`,
              message: "Payment received successfully",
              financial_details: {
                gross_amount: paymentData.amount_paid,
                stripe_fee: financialDetails.stripeFeeInCents,
                platform_fee: financialDetails.platformFeeInCents,
                net_amount: financialDetails.netAmountInCents
              }
            },
            clinic: {
              name: clinicData?.clinic_name || 'Your clinic',
              email: clinicData?.email,
              phone: clinicData?.phone
            }
          };
          
          const { error: clinicNotifyError } = await supabaseClient
            .from("notification_queue")
            .insert({
              type: 'payment_success',
              payload: clinicPayload,
              payment_id: paymentId,
              recipient_type: 'clinic'
            });
            
          if (clinicNotifyError) {
            console.error(`Error queueing clinic notification: ${clinicNotifyError.message}`);
            console.error("Error details:", JSON.stringify(clinicNotifyError));
          } else {
            console.log(`Successfully queued payment notification for clinic`);
          }
        } catch (notifyErr) {
          console.error(`Error in notification processing: ${notifyErr.message}`);
          // Don't rethrow, just log the error - this shouldn't affect the main payment processing
        }
      }
    } catch (error) {
      console.error("Error queueing notifications:", error);
    }
  }

  /**
   * Queue notifications for a failed payment
   */
  static async queuePaymentFailureNotifications(
    supabaseClient: any,
    paymentData: {
      clinicId: string;
      paymentLinkId?: string;
      amount: number;
      patientName?: string;
      patientEmail?: string;
      patientPhone?: string;
    },
    failureDetails: {
      failureMessage: string;
      failureCode: string;
    }
  ) {
    try {
      // Get clinic data for notifications
      const { data: clinicData, error: clinicError } = await supabaseClient
        .from('clinics')
        .select('*')
        .eq('id', paymentData.clinicId)
        .single();
        
      if (clinicError) {
        console.error("Error fetching clinic data:", clinicError);
        console.error("Continuing without clinic data");
      }

      // If we have patient contact information, queue a failure notification
      if (paymentData.patientEmail || paymentData.patientPhone) {
        try {
          // Create notification payload for payment failure with new structure
          const failurePayload = {
            notification_type: "payment_failed",
            notification_method: {
              email: !!paymentData.patientEmail,
              sms: !!paymentData.patientPhone
            },
            patient: {
              name: paymentData.patientName || 'Patient',
              email: paymentData.patientEmail,
              phone: paymentData.patientPhone
            },
            payment: {
              reference: "N/A",
              amount: paymentData.amount, // Store as integer (cents)
              refund_amount: null,
              payment_link: paymentData.paymentLinkId ? `https://clinipay.co.uk/payment/${paymentData.paymentLinkId}` : null,
              message: `Your payment has failed: ${failureDetails.failureMessage}`
            },
            clinic: {
              name: clinicData?.clinic_name || 'Your healthcare provider',
              email: clinicData?.email,
              phone: clinicData?.phone
            },
            error: {
              message: failureDetails.failureMessage,
              code: failureDetails.failureCode
            }
          };
          
          // Add to notification queue
          const { error: notifyError } = await supabaseClient
            .from("notification_queue")
            .insert({
              type: 'payment_failed',
              payload: failurePayload,
              recipient_type: 'patient'
            });
            
          if (notifyError) {
            console.error(`Error queueing payment failure notification: ${notifyError.message}`);
            console.error("Error details:", JSON.stringify(notifyError));
          } else {
            console.log(`Successfully queued payment failure notification for patient`);
          }
        } catch (notifyErr) {
          console.error(`Error in notification processing: ${notifyErr.message}`);
        }
      }
    } catch (error) {
      console.error("Error queueing payment failure notifications:", error);
    }
  }

  /**
   * Queue notifications for a refund
   */
  static async queueRefundNotifications(
    supabaseClient: any,
    paymentData: {
      id: string;
      clinic_id: string;
      patient_name?: string;
      patient_email?: string;
      patient_phone?: string;
      payment_ref: string;
      amount_paid: number;
    },
    refundAmount: number
  ) {
    try {
      // Get clinic data
      const { data: clinicData, error: clinicError } = await supabaseClient
        .from("clinics")
        .select("*")
        .eq("id", paymentData.clinic_id)
        .single();
        
      if (clinicError) {
        console.error("Error fetching clinic data:", clinicError);
      }
      
      // Notify the patient if we have contact details
      if (paymentData.patient_email || paymentData.patient_phone) {
        const patientPayload = {
          notification_type: "refund_processed",
          notification_method: {
            email: !!paymentData.patient_email,
            sms: !!paymentData.patient_phone
          },
          patient: {
            name: paymentData.patient_name || 'Patient',
            email: paymentData.patient_email,
            phone: paymentData.patient_phone
          },
          payment: {
            reference: paymentData.payment_ref,
            amount: paymentData.amount_paid,
            refund_amount: refundAmount,
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentData.id}`,
            message: `Your refund of £${refundAmount.toFixed(2)} has been processed`
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your healthcare provider',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        const { error: notifyError } = await supabaseClient
          .from("notification_queue")
          .insert({
            type: 'refund_processed',
            payload: patientPayload,
            payment_id: paymentData.id,
            recipient_type: 'patient'
          });
          
        if (notifyError) {
          console.error("Error queueing patient refund notification:", notifyError);
        } else {
          console.log("Successfully queued refund notification for patient");
        }
      }
      
      // Notify the clinic
      if (clinicData) {
        const clinicPayload = {
          notification_type: "refund_processed",
          notification_method: {
            email: clinicData?.email_notifications ?? true,
            sms: clinicData?.sms_notifications ?? false
          },
          patient: {
            name: paymentData.patient_name || 'Patient',
            email: paymentData.patient_email,
            phone: paymentData.patient_phone
          },
          payment: {
            reference: paymentData.payment_ref,
            amount: paymentData.amount_paid,
            refund_amount: refundAmount,
            payment_link: `https://clinipay.co.uk/payment-receipt/${paymentData.id}`,
            message: `A refund of £${refundAmount.toFixed(2)} has been processed`,
            financial_details: {
              gross_amount: paymentData.amount_paid,
              refund_amount: refundAmount
            }
          },
          clinic: {
            name: clinicData?.clinic_name || 'Your clinic',
            email: clinicData?.email,
            phone: clinicData?.phone
          }
        };
        
        const { error: clinicNotifyError } = await supabaseClient
          .from("notification_queue")
          .insert({
            type: 'refund_processed',
            payload: clinicPayload,
            payment_id: paymentData.id,
            recipient_type: 'clinic'
          });
          
        if (clinicNotifyError) {
          console.error("Error queueing clinic refund notification:", clinicNotifyError);
        } else {
          console.log("Successfully queued refund notification for clinic");
        }
      }
    } catch (notifyError) {
      console.error("Error processing refund notifications:", notifyError);
    }
  }
}
