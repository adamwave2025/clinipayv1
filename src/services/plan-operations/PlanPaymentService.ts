import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generatePaymentReference, generateManualPaymentReference } from '@/utils/paymentUtils';
import { PlanStatusService } from '@/services/PlanStatusService';
import { PlanPaymentMetrics } from '@/services/plan-status/PlanPaymentMetrics';
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';
import { PaymentNotificationService } from '@/modules/payment/services/PaymentNotificationService';

/**
 * Service for handling payment-related operations within plans
 */
export class PlanPaymentService {
  /**
   * Reschedule a payment to a new date
   */
  static async reschedulePayment(paymentId: string, newDate: Date): Promise<{ success: boolean, error?: any }> {
    try {
      // Format date as YYYY-MM-DD using date-fns
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      console.log('Rescheduling payment with formatted date:', formattedDate);
      
      // First get the current payment schedule entry to see if it has a payment request
      const { data: scheduleEntry, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('payment_request_id, status, due_date, plan_id')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment schedule:', fetchError);
        throw fetchError;
      }
      
      // If there's a payment request, cancel it
      if (scheduleEntry.payment_request_id) {
        console.log(`Cancelling payment request: ${scheduleEntry.payment_request_id}`);
        const { error: cancelError } = await supabase
          .from('payment_requests')
          .update({ status: 'cancelled' })
          .eq('id', scheduleEntry.payment_request_id);
          
        if (cancelError) {
          console.error('Error cancelling payment request:', cancelError);
          throw cancelError;
        }
      }
      
      // Update the payment schedule with the new date
      const { data: updatedSchedule, error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          due_date: formattedDate,
          status: 'pending', // Reset status to pending
          payment_request_id: null, // Clear payment request ID
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();
        
      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw updateError;
      }
      
      // Log the activity
      if (scheduleEntry.plan_id) {
        // Get plan and patient details
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('id, title, patient_id, clinic_id, payment_link_id')
          .eq('id', scheduleEntry.plan_id)
          .single();
          
        if (planError) {
          console.error('Error fetching plan data:', planError);
        } else {
          // Record the activity
          await supabase.from('payment_activity').insert({
            plan_id: planData.id,
            payment_link_id: planData.payment_link_id,
            patient_id: planData.patient_id,
            clinic_id: planData.clinic_id,
            action_type: 'reschedule_payment',
            details: {
              previous_date: scheduleEntry.due_date,
              new_date: formattedDate,
              payment_request_cancelled: scheduleEntry.payment_request_id ? true : false
            }
          });
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error in reschedulePayment:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Record a manual payment for an installment
   * 
   * =====================================================================
   * IMPORTANT: "MARK AS PAID" FUNCTIONALITY - DO NOT MODIFY UNLESS FIXING 
   * ISSUES SPECIFICALLY WITH THE MARK AS PAID FEATURE
   * =====================================================================
   * 
   * This function handles marking a payment as manually paid in the system.
   * It creates payment records, updates payment schedule status, and updates
   * the plan progress. It also checks if this is the final payment in a plan
   * and will mark the plan as completed if all installments are now paid.
   * 
   * UPDATED: Now sends webhook notifications directly without using the notification queue
   */
  static async recordManualPayment(paymentId: string): Promise<{ success: boolean, error?: any }> {
    try {
      // First get the payment schedule entry
      const { data: scheduleEntry, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, plan_id, amount, payment_number, total_payments, patient_id, clinic_id, payment_link_id, due_date, payment_request_id')
        .eq('id', paymentId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment schedule:', fetchError);
        throw fetchError;
      }
      
      // Get patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('name, email, phone')
        .eq('id', scheduleEntry.patient_id)
        .single();
        
      if (patientError) {
        console.error('Error fetching patient data:', patientError);
        // Continue even if we can't fetch patient details - just log the error
      }
      
      // Generate a payment reference for manual payments
      const paymentRef = generateManualPaymentReference();
      console.log('Generated manual payment reference:', paymentRef);
      
      // Create a payment record for the manual payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_schedule_id: scheduleEntry.id,
          amount_paid: scheduleEntry.amount,
          status: 'paid',
          manual_payment: true,
          patient_id: scheduleEntry.patient_id,
          clinic_id: scheduleEntry.clinic_id,
          payment_link_id: scheduleEntry.payment_link_id,
          paid_at: new Date().toISOString(),
          // Add missing fields
          patient_name: patientData?.name || 'Unknown',
          patient_email: patientData?.email || null,
          patient_phone: patientData?.phone || null,
          payment_ref: paymentRef,
          net_amount: scheduleEntry.amount // Set net amount to the payment amount
        })
        .select()
        .single();
        
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }
      
      // Check if the payment has an associated payment_request and update it
      if (scheduleEntry.payment_request_id) {
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            payment_id: payment.id,
            paid_at: new Date().toISOString()
          })
          .eq('id', scheduleEntry.payment_request_id);
          
        if (requestUpdateError) {
          console.error('Error updating payment request:', requestUpdateError);
          // Continue even if we can't update the payment request - just log the error
        } else {
          console.log(`Updated payment request ${scheduleEntry.payment_request_id} to paid status`);
        }
      }
      
      // Update the payment schedule status
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
        
      if (updateError) {
        console.error('Error updating payment schedule:', updateError);
        throw updateError;
      }
      
      // Update the plan progress
      if (scheduleEntry.plan_id) {
        // Get current plan data
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('paid_installments, total_installments, progress, status')
          .eq('id', scheduleEntry.plan_id)
          .single();
          
        if (planError) {
          console.error('Error fetching plan data:', planError);
        } else {
          // Calculate new progress values
          const newPaidInstallments = (planData.paid_installments || 0) + 1;
          const newProgress = Math.round((newPaidInstallments / planData.total_installments) * 100);
          
          // =====================================================================
          // IMPORTANT: FIX - Set plan to 'active' after first payment, or completed if all payments are made
          // =====================================================================
          let newStatus = planData.status;
          let nextDueDate = null;
          
          // If this payment completes the plan, set status to completed
          if (newPaidInstallments >= planData.total_installments) {
            console.log(`Plan ${scheduleEntry.plan_id} is now complete. Setting status to completed.`);
            newStatus = 'completed';
            // When plan is completed, next_due_date should be null (consistent with webhook behavior)
            nextDueDate = null;
          } 
          // If this is the first payment, set status to active (FIX: added this condition)
          else if (newPaidInstallments === 1 && (planData.status === 'pending' || planData.status === 'overdue')) {
            console.log(`First payment for plan ${scheduleEntry.plan_id} completed. Setting status to active.`);
            newStatus = 'active';
            
            // Calculate the next due date
            const { data: nextPaymentData, error: nextPaymentError } = await supabase
              .from('payment_schedule')
              .select('due_date')
              .eq('plan_id', scheduleEntry.plan_id)
              .eq('status', 'pending')
              .order('due_date', { ascending: true })
              .limit(1)
              .single();
              
            if (!nextPaymentError && nextPaymentData) {
              nextDueDate = nextPaymentData.due_date;
            }
          }
          // If it's an existing active plan, just update the next due date
          else {
            // Calculate the next due date
            const { data: nextPaymentData, error: nextPaymentError } = await supabase
              .from('payment_schedule')
              .select('due_date')
              .eq('plan_id', scheduleEntry.plan_id)
              .eq('status', 'pending')
              .order('due_date', { ascending: true })
              .limit(1)
              .single();
              
            if (!nextPaymentError && nextPaymentData) {
              nextDueDate = nextPaymentData.due_date;
            }
          }
          
          // Update the plan with the new status, progress and next due date
          const { error: planUpdateError } = await supabase
            .from('plans')
            .update({
              paid_installments: newPaidInstallments,
              progress: newProgress,
              status: newStatus,
              next_due_date: nextDueDate,
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduleEntry.plan_id);
            
          if (planUpdateError) {
            console.error('Error updating plan progress:', planUpdateError);
          } else {
            console.log(`Plan ${scheduleEntry.plan_id} updated: status=${newStatus}, progress=${newProgress}%, paid=${newPaidInstallments}/${planData.total_installments}`);
            
            // Use PlanPaymentMetrics to ensure accurate metrics are maintained
            await PlanPaymentMetrics.updatePlanPaymentMetrics(scheduleEntry.plan_id);
          }
        }
        
        // Record the activity
        await supabase.from('payment_activity').insert({
          plan_id: scheduleEntry.plan_id,
          payment_link_id: scheduleEntry.payment_link_id,
          patient_id: scheduleEntry.patient_id,
          clinic_id: scheduleEntry.clinic_id,
          action_type: 'manual_payment_recorded',
          details: {
            payment_id: payment.id,
            amount: scheduleEntry.amount,
            payment_number: scheduleEntry.payment_number,
            total_payments: scheduleEntry.total_payments,
            due_date: scheduleEntry.due_date,
            payment_ref: paymentRef
          }
        });

        // Get clinic details for notification
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', scheduleEntry.clinic_id)
          .single();

        if (clinicError) {
          console.error('Error fetching clinic data for webhook notification:', clinicError);
        } else if (patientData && patientData.email) {
          // Only send notification if we have patient data
          console.log('⚠️ CRITICAL: Preparing direct webhook notifications for manual payment');
          
          try {
            const notificationMethod: NotificationMethod = {
              email: !!patientData.email,
              sms: !!patientData.phone
            };

            const formattedAddress = ClinicFormatter.formatAddress(clinicData);
            
            // Create the notification payload for a successful payment (patient notification)
            const patientNotificationPayload: StandardNotificationPayload = {
              notification_type: "payment_success",
              notification_method: notificationMethod,
              patient: {
                name: patientData.name || 'Patient',
                email: patientData.email,
                phone: patientData.phone
              },
              payment: {
                reference: paymentRef,
                amount: scheduleEntry.amount,
                refund_amount: null,
                payment_link: `https://clinipay.co.uk/payment-receipt/${payment.id}`,
                message: "Your payment was successfully recorded"
              },
              clinic: {
                name: clinicData.clinic_name || "Your healthcare provider",
                email: clinicData.email,
                phone: clinicData.phone,
                address: formattedAddress
              }
            };
            
            // Create clinic notification payload
            const clinicNotificationPayload: StandardNotificationPayload = {
              ...patientNotificationPayload,
              notification_type: "payment_success",
              notification_method: {
                email: !!clinicData.email_notifications,
                sms: !!clinicData.sms_notifications
              },
              payment: {
                ...patientNotificationPayload.payment,
                financial_details: {
                  gross_amount: scheduleEntry.amount,
                  stripe_fee: 0, // No Stripe fee for manual payments
                  platform_fee: 0, // No platform fee for manual payments
                  net_amount: scheduleEntry.amount
                }
              }
            };
            
            console.log(`⚠️ CRITICAL: Sending notifications with clinic_id: ${scheduleEntry.clinic_id}`);
            
            // Send both notifications directly using our new service
            const notificationResult = await PaymentNotificationService.sendManualPaymentNotifications(
              patientNotificationPayload,
              clinicNotificationPayload,
              scheduleEntry.clinic_id
            );
            
            if (!notificationResult.success) {
              console.error(`⚠️ CRITICAL ERROR: Failed to send notifications: ${notificationResult.error}`);
            } else {
              console.log('✅ Payment notifications sent successfully');
            }
          } catch (notifyErr: any) {
            console.error("⚠️ CRITICAL ERROR: Exception during direct notifications:", notifyErr);
          }
        } else {
          console.log('⚠️ No patient email available, skipping notifications');
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('Error in recordManualPayment:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Record a refund for a payment
   */
  static async recordPaymentRefund(paymentId: string, amount: number, isFullRefund: boolean): Promise<{ success: boolean, error?: any }> {
    // Implement refund functionality
    return { success: true };
  }
  
  /**
   * Send a payment reminder for an installment
   */
  static async sendPaymentReminder(installmentId: string): Promise<{ success: boolean, error?: any }> {
    // Implement send reminder functionality
    return { success: true };
  }
}
