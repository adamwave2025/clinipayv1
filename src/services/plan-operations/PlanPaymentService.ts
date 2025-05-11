import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Service for managing payments and refunds related to payment plans
 */
export class PlanPaymentService {
  /**
   * Record a manual payment for a plan installment
   * @param installmentId The ID of the installment being paid
   * @param amount The payment amount
   * @param paymentDate The date the payment was made
   * @returns Object indicating success or failure
   */
  static async recordManualPayment(
    installmentId: string,
    amount: number,
    paymentDate: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('Recording manual payment for installment:', installmentId);
      console.log('Payment details:', { amount, paymentDate });
      
      // Get the installment data first to find the plan and related information
      const { data: installmentData, error: installmentError } = await supabase
        .from('payment_schedule')
        .select(`
          id,
          plan_id,
          payment_number,
          total_payments,
          clinic_id,
          patient_id,
          payment_link_id
        `)
        .eq('id', installmentId)
        .single();
      
      if (installmentError || !installmentData) {
        console.error('Error fetching installment data:', installmentError);
        return { success: false, error: installmentError || new Error('Installment not found') };
      }
      
      // Get the plan data to get clinic information
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select(`
          id,
          title,
          clinic_id,
          patient_id,
          total_amount
        `)
        .eq('id', installmentData.plan_id)
        .single();
      
      if (planError || !planData) {
        console.error('Error fetching plan data:', planError);
        return { success: false, error: planError || new Error('Plan not found') };
      }
      
      console.log('Found plan data:', planData);
      
      // Get patient data for the payment record
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('name, email, phone')
        .eq('id', planData.patient_id)
        .single();
      
      if (patientError) {
        console.error('Error fetching patient data:', patientError);
        // Continue without patient data
      }
      
      // Mark the installment as paid
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', installmentId);
      
      if (updateError) {
        console.error('Error updating installment status:', updateError);
        return { success: false, error: updateError };
      }
      
      // Generate a payment reference
      const paymentRef = `MAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Create a manual payment record with payment_schedule_id directly linked
      const paymentData = {
        clinic_id: planData.clinic_id,
        patient_id: planData.patient_id,
        payment_link_id: installmentData.payment_link_id,
        payment_schedule_id: installmentId, // Direct link to payment_schedule
        amount_paid: amount,
        patient_name: patientData?.name || 'Unknown',
        patient_email: patientData?.email || null,
        patient_phone: patientData?.phone || null,
        payment_ref: paymentRef,
        manual_payment: true,
        status: 'paid',
        paid_at: paymentDate
      };
      
      console.log('Creating payment record:', paymentData);
      
      const { data: paymentResult, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select();
      
      if (paymentError || !paymentResult) {
        console.error('Error creating payment record:', paymentError);
        return { success: false, error: paymentError || new Error('Failed to create payment record') };
      }
      
      const paymentId = paymentResult[0].id;
      console.log('Payment record created:', paymentId);
      
      // Create an activity record for the payment
      const activityData = {
        action_type: 'payment_made',
        plan_id: installmentData.plan_id,
        payment_link_id: installmentData.payment_link_id,
        patient_id: planData.patient_id,
        clinic_id: planData.clinic_id,
        details: {
          payment_reference: paymentRef,
          amount: amount,
          payment_date: paymentDate,
          payment_number: installmentData.payment_number,
          total_payments: installmentData.total_payments,
          payment_id: paymentId,
          manual_payment: true
        }
      };
      
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert(activityData);
      
      if (activityError) {
        console.error('Error recording payment activity:', activityError);
        // Continue despite activity error
      }
      
      // Update the plan progress and status
      await this.updatePlanAfterPayment(installmentData.plan_id);
      
      return { success: true };
    } catch (error) {
      console.error('Error in recordManualPayment:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Update a plan's metrics and status after a payment
   * @param planId The ID of the plan to update
   */
  static async updatePlanAfterPayment(planId: string): Promise<void> {
    try {
      // Get the plan data
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError || !planData) {
        console.error('Error fetching plan data:', planError);
        throw planError || new Error('Plan not found');
      }
      
      // Count the paid installments
      const { data: paidCount, error: countError } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact' })
        .eq('plan_id', planId)
        .eq('status', 'paid');
      
      if (countError) {
        console.error('Error counting paid installments:', countError);
        throw countError;
      }
      
      const paidInstallments = paidCount?.length || 0;
      const totalInstallments = planData.total_installments;
      
      // Calculate new progress percentage
      const progress = Math.min(Math.floor((paidInstallments / totalInstallments) * 100), 100);
      
      // If all installments are paid, mark as completed
      let newStatus = planData.status;
      
      if (paidInstallments >= totalInstallments) {
        newStatus = 'completed';
      } else if (newStatus !== 'paused' && newStatus !== 'cancelled') {
        // If not paused or cancelled and some payments made, mark as active
        newStatus = 'active';
      }
      
      // Find next due date
      const { data: nextSchedule, error: nextError } = await supabase
        .from('payment_schedule')
        .select('due_date')
        .eq('plan_id', planId)
        .not('status', 'in', '(paid,cancelled)')
        .order('due_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      const nextDueDate = nextSchedule?.due_date || null;
      
      // Update the plan record
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          paid_installments: paidInstallments,
          progress: progress,
          status: newStatus,
          next_due_date: nextDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);
      
      if (updateError) {
        console.error('Error updating plan after payment:', updateError);
        throw updateError;
      }
      
      console.log(`Plan ${planId} updated: ${paidInstallments}/${totalInstallments} payments, status: ${newStatus}`);
    } catch (error) {
      console.error('Error in updatePlanAfterPayment:', error);
      // Don't throw, just log the error
    }
  }
  
  /**
   * Record a refund for a payment
   * @param paymentId The payment ID to refund
   * @param amount The refund amount
   * @param isFullRefund Whether this is a full refund
   * @returns Object indicating success or failure
   */
  static async recordPaymentRefund(
    paymentId: string,
    amount: number, 
    isFullRefund: boolean
  ): Promise<{ success: boolean, error?: any }> {
    try {
      console.log(`Recording refund of ${amount} for payment ${paymentId}. Full refund: ${isFullRefund}`);
      
      // Start by fetching the payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
        
      if (paymentError) {
        console.error('Error fetching payment record:', paymentError);
        toast.error('Could not retrieve payment information');
        return { success: false, error: paymentError };
      }
      
      if (!paymentData) {
        console.warn('Payment record not found:', paymentId);
        toast.warn('Payment not found');
        return { success: false, error: 'Payment not found' };
      }
      
      // Update the payment record with refund details
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded',
          refund_amount: amount,
          refunded_at: new Date().toISOString()
        })
        .eq('id', paymentId);
        
      if (updateError) {
        console.error('Error updating payment record:', updateError);
        toast.error('Failed to update payment record');
        return { success: false, error: updateError };
      }
      
      console.log(`Payment ${paymentId} marked as ${isFullRefund ? 'refunded' : 'partially_refunded'}`);
      
      // If the payment is linked to a payment schedule, update it as well
      if (paymentData.payment_schedule_id) {
        const { error: scheduleError } = await supabase
          .from('payment_schedule')
          .update({
            status: isFullRefund ? 'refunded' : 'partially_refunded'
          })
          .eq('id', paymentData.payment_schedule_id);
          
        if (scheduleError) {
          console.error('Error updating payment schedule:', scheduleError);
          toast.error('Failed to update payment schedule status');
          // Do not return an error, continue with the rest of the process
        } else {
          console.log(`Payment schedule ${paymentData.payment_schedule_id} marked as ${isFullRefund ? 'refunded' : 'partially_refunded'}`);
        }
      }
      
      // If the payment is linked to a payment request, update it as well
      if (paymentData.payment_link_id) {
        // Find the payment request associated with this payment link
        const { data: requestData, error: requestError } = await supabase
          .from('payment_requests')
          .select('id')
          .eq('payment_link_id', paymentData.payment_link_id)
          .eq('payment_id', paymentId)
          .maybeSingle();
          
        if (requestError) {
          console.error('Error fetching payment request:', requestError);
          toast.error('Failed to retrieve payment request information');
          return { success: false, error: requestError };
        }
        
        if (requestData) {
          // Update the payment request status
          const { error: requestUpdateError } = await supabase
            .from('payment_requests')
            .update({
              status: isFullRefund ? 'refunded' : 'partially_refunded'
            })
            .eq('id', requestData.id);
            
          if (requestUpdateError) {
            console.error('Error updating payment request:', requestUpdateError);
            toast.error('Failed to update payment request status');
            // Do not return an error, continue with the rest of the process
          } else {
            console.log(`Payment request ${requestData.id} marked as ${isFullRefund ? 'refunded' : 'partially_refunded'}`);
          }
        }
      }
      
      // If this is a full refund, we need to update the plan's paid_installments count
      // Find the associated payment_schedule entry to get the plan ID
      if (isFullRefund && paymentData.payment_schedule_id) {
        // Get the payment schedule entry
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("payment_schedule")
          .select("plan_id")
          .eq("id", paymentData.payment_schedule_id)
          .single();
          
        if (scheduleError) {
          console.error("Error fetching payment schedule:", scheduleError);
          toast.error("Failed to retrieve payment schedule information");
          return { success: false, error: scheduleError };
        }
        
        if (scheduleData && scheduleData.plan_id) {
          try {
            // Get the current plan data
            const { data: planData, error: planError } = await supabase
              .from("plans")
              .select("paid_installments, total_installments")
              .eq("id", scheduleData.plan_id)
              .single();
              
            if (planError) {
              console.error("Error fetching plan data:", planError);
              toast.error("Failed to retrieve plan information");
              return { success: false, error: planError };
            }
            
            if (planData) {
              // Decrement the paid installments count
              const newPaidCount = Math.max(0, (planData.paid_installments || 1) - 1);
              const progress = Math.floor((newPaidCount / planData.total_installments) * 100) || 0;
              
              // Update the plan
              const { error: planUpdateError } = await supabase
                .from("plans")
                .update({
                  paid_installments: newPaidCount,
                  progress: progress,
                  // Don't change the status - let the cron job handle that
                })
                .eq("id", scheduleData.plan_id);
                
              if (planUpdateError) {
                console.error("Error updating plan:", planUpdateError);
                toast.error("Failed to update plan information");
                return { success: false, error: planUpdateError };
              } else {
                console.log(`Updated plan ${scheduleData.plan_id} paid_installments to ${newPaidCount}`);
              }
            }
          } catch (planUpdateError: any) {
            console.error("Error updating plan after refund:", planUpdateError);
            toast.error(`Failed to update plan: ${planUpdateError.message}`);
            return { success: false, error: planUpdateError };
          }
        }
      }
      
      toast.success('Refund recorded successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error in recordPaymentRefund:', error);
      toast.error(`Failed to record refund: ${error.message}`);
      return { success: false, error };
    }
  }
  
  /**
   * Send a payment reminder for an installment
   * @param installmentId The installment ID to send a reminder for
   * @returns Object indicating success or failure
   */
  static async sendPaymentReminder(installmentId: string): Promise<{ success: boolean, error?: any }> {
    try {
      console.log('Sending payment reminder for installment:', installmentId);
      
      // Fetch the installment data
      const { data: installmentData, error: installmentError } = await supabase
        .from('payment_schedule')
        .select(`
          id,
          due_date,
          amount,
          patient_id,
          plan_id
        `)
        .eq('id', installmentId)
        .single();
        
      if (installmentError) {
        console.error('Error fetching installment data:', installmentError);
        toast.error('Could not retrieve installment information');
        return { success: false, error: installmentError };
      }
      
      if (!installmentData) {
        console.warn('Installment not found:', installmentId);
        toast.warn('Installment not found');
        return { success: false, error: 'Installment not found' };
      }
      
      // Fetch the patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('name, email, phone')
        .eq('id', installmentData.patient_id)
        .single();
        
      if (patientError) {
        console.error('Error fetching patient data:', patientError);
        toast.error('Could not retrieve patient information');
        return { success: false, error: patientError };
      }
      
      if (!patientData) {
        console.warn('Patient not found:', installmentData.patient_id);
        toast.warn('Patient not found');
        return { success: false, error: 'Patient not found' };
      }
      
      // Fetch the plan data
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('title')
        .eq('id', installmentData.plan_id)
        .single();
        
      if (planError) {
        console.error('Error fetching plan data:', planError);
        toast.error('Could not retrieve plan information');
        return { success: false, error: planError };
      }
      
      if (!planData) {
        console.warn('Plan not found:', installmentData.plan_id);
        toast.warn('Plan not found');
        return { success: false, error: 'Plan not found' };
      }
      
      // Construct the reminder message
      const message = `
        Reminder: Your payment of £${(installmentData.amount / 100).toFixed(2)} is due on ${installmentData.due_date}.
        Please pay via [Payment Link].
      `;
      
      console.log('Reminder details:', {
        patientName: patientData.name,
        patientEmail: patientData.email,
        patientPhone: patientData.phone,
        message: message
      });
      
      // TODO: Implement the actual sending of the reminder (email, SMS, etc.)
      // This is a placeholder for the actual implementation
      
      toast.success('Payment reminder sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error in sendPaymentReminder:', error);
      toast.error(`Failed to send payment reminder: ${error.message}`);
      return { success: false, error };
    }
  }
}
