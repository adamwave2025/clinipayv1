
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner';
import { isPaymentStatusModifiable, getModifiableStatuses } from '@/utils/paymentStatusUtils';
import { PlanStatusService } from '@/services/PlanStatusService';
import { format } from 'date-fns';
import { recordPaymentPlanActivity } from './PaymentScheduleService';
import { ResumePlanParams, ResumePlanResponse } from '@/types/supabaseRpcTypes';

/**
 * Service for performing operations on payment plans
 * Consolidated service that handles all plan modifications in one place
 */
export class PlanOperationsService {
  /**
   * Cancel a payment plan
   * @param plan The plan to cancel
   * @returns boolean indicating success or failure
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    try {
      console.log(`Cancelling plan ${plan.id} (${plan.title || plan.planName})`);
      
      // 1. Update the plan status in the plans table
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ status: 'cancelled' })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // 2. Update all pending payment schedules to cancelled
      // Only update schedules that are in a modifiable state (not paid)
      const modifiableStatuses = getModifiableStatuses();
      
      const { error: scheduleUpdateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'cancelled' })
        .eq('plan_id', plan.id)
        .in('status', modifiableStatuses);
        
      if (scheduleUpdateError) throw scheduleUpdateError;
      
      // 3. Also cancel any active payment requests associated with this plan's schedules
      const { data: paymentRequests, error: requestsError } = await supabase
        .from('payment_schedule')
        .select('payment_request_id')
        .eq('plan_id', plan.id)
        .not('payment_request_id', 'is', null);
        
      if (requestsError) throw requestsError;
      
      // Extract the request IDs
      const requestIds = paymentRequests
        .map(item => item.payment_request_id)
        .filter(id => id !== null);
        
      // Update payment requests if there are any
      if (requestIds.length > 0) {
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
            // Removed updated_at as it doesn't exist in the table
          })
          .in('id', requestIds);
          // CRITICAL: Removed conditional is('payment_id', null) to ensure ALL requests get cancelled
          
        if (requestUpdateError) {
          console.error('Error updating payment requests:', requestUpdateError);
          // Non-critical error, continue with the operation
        }
      }
      
      // 3. Add an activity log entry
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id, // Make sure to include plan_id for easier activity tracking
          action_type: 'cancel_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: plan.status
          }
        });
      
      if (activityError) {
        console.error('Error logging cancel activity:', activityError);
      }
      
      console.log('Plan cancelled successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error cancelling plan:', error);
      return false;
    }
  }
  
  /**
   * Pause a payment plan
   * @param plan The plan to pause
   * @returns boolean indicating success or failure
   */
  static async pausePlan(plan: Plan): Promise<boolean> {
    try {
      console.log(`Starting pause operation for plan: ${plan.id} (${plan.title || plan.planName})`);
    
      // Get the current plan to ensure it exists
      const { data: planData, error: planFetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan.id)
        .single();
        
      if (planFetchError) {
        console.error('Error fetching plan data:', planFetchError);
        throw planFetchError;
      }
      
      // Find payment requests that need to be cancelled
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select('id, payment_request_id, status')
        .eq('plan_id', plan.id)
        .in('status', ['pending', 'sent', 'overdue'])
        .not('payment_request_id', 'is', null);
        
      if (scheduleError) {
        console.error('Error fetching payment schedules:', scheduleError);
        throw scheduleError;
      }
      
      console.log(`Found ${scheduleData?.length || 0} payment schedules with request IDs`);
      
      // Extract payment request IDs
      const paymentRequestIds = scheduleData
        ?.filter(item => item.payment_request_id)
        .map(item => item.payment_request_id) || [];
        
      console.log(`Identified ${paymentRequestIds.length} payment requests to cancel:`, paymentRequestIds);
      
      // Cancel payment requests first - CRITICAL CHANGE: Remove the is('payment_id', null) condition
      if (paymentRequestIds.length > 0) {
        const { data: updatedRequests, error: requestCancelError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
            // Removed updated_at as it doesn't exist in the table
          })
          .in('id', paymentRequestIds)
          // No condition here for payment_id
          .select();
          
        if (requestCancelError) {
          console.error('Error cancelling payment requests:', requestCancelError);
          // No longer just a warning - throw the error to stop the operation
          throw new Error(`Failed to cancel payment requests: ${requestCancelError.message}`);
        } else {
          console.log(`Successfully cancelled ${updatedRequests?.length || 0} payment requests:`, 
            updatedRequests?.map(r => r.id));
        }
      }
      
      // After successfully cancelling requests, update payment schedules
      const { data: updatedSchedules, error: updateScheduleError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan.id)
        .in('status', ['pending', 'scheduled', 'sent', 'overdue'])
        .select();
        
      if (updateScheduleError) {
        console.error('Error updating payment schedules:', updateScheduleError);
        throw updateScheduleError;
      }
      
      console.log(`Successfully paused ${updatedSchedules?.length || 0} payment schedules`);
      
      // After payment schedules are updated, update the plan status
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);
        
      if (planUpdateError) {
        console.error('Error updating plan status:', planUpdateError);
        throw planUpdateError;
      }
      
      // Record the activity
      await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id,
          action_type: 'plan_paused',
          details: {
            paused_at: new Date().toISOString(),
            payment_requests_cancelled: paymentRequestIds.length
          }
        });
      
      console.log('Plan paused successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error pausing payment plan:', error);
      return false;
    }
  }
  
  /**
   * Resume a paused payment plan
   * @param plan The plan to resume
   * @param resumeDate Required date to resume the plan
   * @returns boolean indicating success or failure
   */
  static async resumePlan(plan: Plan, resumeDate: Date): Promise<boolean> {
    try {
      console.log('▶️ RESUME PLAN OPERATION STARTED');
      console.log(`📋 Plan ID: ${plan.id}, Plan Title: ${plan.title || plan.planName}`);
      console.log(`📅 Resume Date: ${resumeDate.toISOString()}`);
      
      // Validate the resume date
      if (!resumeDate) {
        console.error('❌ No resume date provided');
        throw new Error('Resume date is required');
      }
      
      // STEP 1: Verify the plan exists and is in paused status
      const { data: currentPlan, error: planError } = await supabase
        .from('plans')
        .select('id, status')
        .eq('id', plan.id)
        .single();
        
      if (planError) {
        console.error('❌ Error fetching plan:', planError);
        throw new Error(`Failed to fetch plan: ${planError.message}`);
      }
      
      if (!currentPlan) {
        console.error('❌ Plan not found:', plan.id);
        throw new Error('Plan not found');
      }
      
      if (currentPlan.status !== 'paused') {
        console.error('❌ Plan is not in paused status:', currentPlan.status);
        throw new Error(`Plan is in ${currentPlan.status} status and cannot be resumed`);
      }
      
      console.log('✅ Plan verified: exists and is in paused status');
      
      // STEP 2: Get all paused payments for this plan
      const { data: pausedSchedules, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, status, payment_request_id, due_date')
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
        
      if (fetchError) {
        console.error('❌ Error fetching paused schedules:', fetchError);
        throw new Error(`Failed to fetch paused schedules: ${fetchError.message}`);
      }
      
      if (!pausedSchedules || pausedSchedules.length === 0) {
        console.error('❌ No paused payments found to resume');
        throw new Error('No paused payments found to resume');
      }
      
      console.log(`✅ Found ${pausedSchedules.length} paused payments to resume`);
      
      // STEP 3: Cancel any payment requests for paused payments
      const paymentRequestIds = pausedSchedules
        .filter(schedule => schedule.payment_request_id)
        .map(schedule => schedule.payment_request_id);
      
      if (paymentRequestIds.length > 0) {
        console.log(`🚫 Cancelling ${paymentRequestIds.length} existing payment requests`);
        
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({ status: 'cancelled' })
          .in('id', paymentRequestIds);
          
        if (requestUpdateError) {
          console.error('❌ Error cancelling payment requests:', requestUpdateError);
          throw new Error(`Failed to cancel payment requests: ${requestUpdateError.message}`);
        }
        
        // Clear payment_request_id for all paused payments
        const { error: clearRequestIdError } = await supabase
          .from('payment_schedule')
          .update({ 
            payment_request_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('plan_id', plan.id)
          .eq('status', 'paused');
        
        if (clearRequestIdError) {
          console.error('❌ Error clearing payment request IDs:', clearRequestIdError);
          throw new Error(`Failed to clear payment request IDs: ${clearRequestIdError.message}`);
        }
        
        console.log('✅ Successfully cancelled payment requests and cleared payment_request_id');
      }

      // STEP 4: Format date as YYYY-MM-DD for the database function call
      const formattedDate = resumeDate.toISOString().split('T')[0]; 
      console.log('📞 Calling resume_payment_plan with formatted date:', formattedDate);
      
      // STEP 5: Call the resume_payment_plan function to reschedule the payments
      // Using our custom type for proper parameter passing
      const params: ResumePlanParams = {
        plan_id: plan.id,
        resume_date: formattedDate,
        payment_status: 'paused'
      };
      
      // Fixed: Using rpc() correctly - specify the return type, NOT using generic parameters for function name constraints
      const { data: schedulingResult, error: schedulingError } = await supabase
        .rpc('resume_payment_plan', params);
      
      if (schedulingError) {
        console.error('❌ Error in resume_payment_plan function:', schedulingError);
        throw new Error(`Database function error: ${schedulingError.message}`);
      }
      
      // Log scheduling result for debugging
      console.log('📊 Rescheduling result:', schedulingResult);
      
      if (!schedulingResult) {
        console.error('❌ Database function returned no result');
        throw new Error('Database function failed to reschedule payments');
      }
      
      if (typeof schedulingResult === 'object' && 'error' in schedulingResult) {
        console.error('❌ Database function returned error:', schedulingResult.error);
        throw new Error(`Database function error: ${String(schedulingResult.error)}`);
      }
      
      // STEP 6: ONLY NOW update the status of payments from paused to pending
      // This is the critical fix - we update statuses AFTER rescheduling, not before
      console.log('🔄 Now updating payment statuses from paused to pending');
      
      const { error: statusUpdateError } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
      
      if (statusUpdateError) {
        console.error('❌ Error updating payment status to pending:', statusUpdateError);
        throw new Error(`Failed to update payment status: ${statusUpdateError.message}`);
      }
      
      console.log('✅ Successfully updated all paused payments to pending status');
      
      // STEP 7: Verify that the payments have been rescheduled
      const { data: updatedPayments, error: updatedPaymentsError } = await supabase
        .from('payment_schedule')
        .select('id, due_date, status')
        .eq('plan_id', plan.id)
        .order('due_date', { ascending: true });
        
      if (updatedPaymentsError) {
        console.error('❌ Error fetching updated payments:', updatedPaymentsError);
        throw new Error(`Failed to verify updated payments: ${updatedPaymentsError.message}`);
      }
      
      console.log('🔄 Updated payment schedule:', updatedPayments);
      
      if (!updatedPayments || updatedPayments.length === 0) {
        console.error('❌ No payments found after rescheduling');
        throw new Error('No payments found after rescheduling');
      }
      
      // STEP 8: Record the resume activity
      await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id,
          action_type: 'resume_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_status: 'paused',
            resume_date: resumeDate.toISOString(),
            installments_affected: pausedSchedules.length,
            sent_payments_reset: paymentRequestIds.length,
            days_shifted: schedulingResult && 
              typeof schedulingResult === 'object' && 
              'days_shifted' in schedulingResult ? 
              String(schedulingResult.days_shifted) : '0'
          }
        });
      
      // STEP 9: Update the plan status
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ 
          status: 'active', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', plan.id);
      
      if (planUpdateError) {
        console.error('⚠️ Warning: Failed to update plan status after resume:', planUpdateError);
        // Don't throw an error here, as the resumption operation was successful
      } else {
        console.log('✅ Plan status updated to active');
      }
      
      console.log('✅ RESUME PLAN OPERATION COMPLETED SUCCESSFULLY');
      return true;
      
    } catch (error: any) {
      console.error('❌ ERROR RESUMING PLAN:', error);
      
      // Log detailed error information
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.details) {
        console.error('Error details:', error.details);
      }
      
      // Try to add a recovery record to track the error
      try {
        await supabase
          .from('payment_activity')
          .insert({
            payment_link_id: plan.paymentLinkId,
            patient_id: plan.patientId,
            clinic_id: plan.clinicId,
            plan_id: plan.id,
            action_type: 'resume_plan_error',
            details: {
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            }
          });
      } catch (logError) {
        console.error('Failed to log resume plan error:', logError);
      }
      
      return false;
    }
  }
  
  /**
   * Reschedule a payment plan with a new start date
   * @param plan The plan to reschedule
   * @param newStartDate The new start date for the plan
   * @returns boolean indicating success or failure
   */
  static async reschedulePlan(plan: Plan, newStartDate: Date): Promise<boolean> {
    try {
      // Format date as YYYY-MM-DD for the database
      const formattedDate = newStartDate.toISOString().split('T')[0];
      console.log('Rescheduling plan with formatted date:', formattedDate);
      
      // Get the current plan to calculate days difference
      const { data: currentPlan, error: planError } = await supabase
        .from('plans')
        .select('start_date, status')
        .eq('id', plan.id)
        .single();
      
      if (planError) throw planError;
      
      // Calculate the difference in days between the old and new start dates
      const oldStartDate = new Date(currentPlan.start_date);
      const diffTime = newStartDate.getTime() - oldStartDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log('Shifting all pending payments by', diffDays, 'days');
      
      // Check if there are any paid payments for this plan
      const { count: paidCount, error: paidCountError } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact', head: false })
        .eq('plan_id', plan.id)
        .eq('status', 'paid');
        
      if (paidCountError) throw paidCountError;
      
      console.log(`Found ${paidCount} paid payments for this plan`);
      
      // Track how many payment requests we need to cancel
      let paymentRequestCount = 0;
      const paymentRequestIds = [];
      
      // Get all modifiable schedule entries
      const { data: scheduleEntries, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select('id, payment_request_id, status, due_date')
        .eq('plan_id', plan.id)
        .in('status', getModifiableStatuses());
        
      if (scheduleError) throw scheduleError;
      
      console.log(`Found ${scheduleEntries?.length || 0} modifiable payment schedules`);
      
      // Identify payment requests to cancel
      for (const entry of scheduleEntries || []) {
        if (entry.payment_request_id) {
          paymentRequestIds.push(entry.payment_request_id);
          paymentRequestCount++;
        }
      }
      
      console.log(`Found ${paymentRequestIds.length} payment requests to cancel`);
      
      // Cancel active payment requests since dates will change - CRITICAL: removed is('payment_id', null) condition
      if (paymentRequestIds.length > 0) {
        const { data: updatedRequests, error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
            // Removed updated_at as it doesn't exist in the table
          })
          .in('id', paymentRequestIds)
          .select();
          
        if (requestUpdateError) {
          console.error('Error updating payment requests:', requestUpdateError);
          throw new Error(`Failed to cancel payment requests: ${requestUpdateError.message}`);
        } else {
          console.log(`Successfully cancelled ${updatedRequests?.length || 0} payment requests`);
        }
      }
      
      // Update the plan's start date
      const { error: startDateUpdateError } = await supabase
        .from('plans')
        .update({ 
          start_date: formattedDate,
          status: paidCount > 0 ? 'active' : 'pending', // If payments made, plan is active, otherwise pending
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);
        
      if (startDateUpdateError) throw startDateUpdateError;
      
      // Shift all modifiable payment due dates by the day difference
      let shiftedCount = 0;
      for (const entry of scheduleEntries || []) {
        const currentDueDate = new Date(entry.due_date);
        const newDueDate = new Date(currentDueDate.getTime() + diffDays * 24 * 60 * 60 * 1000);
        
        const { error: dueDateUpdateError } = await supabase
          .from('payment_schedule')
          .update({
            due_date: newDueDate.toISOString().split('T')[0],
            status: 'pending', // Reset status to pending
            payment_request_id: null, // Clear any payment request associations
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.id);
          
        if (dueDateUpdateError) {
          console.error('Error updating due date:', dueDateUpdateError);
        } else {
          shiftedCount++;
        }
      }
      
      console.log(`Successfully shifted ${shiftedCount} payment schedules`);
      
      // Calculate next due date
      const { data: nextPayment, error: nextPaymentError } = await supabase
        .from('payment_schedule')
        .select('due_date')
        .eq('plan_id', plan.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(1)
        .single();
        
      // Update the next due date if found
      if (!nextPaymentError && nextPayment) {
        await supabase
          .from('plans')
          .update({
            next_due_date: nextPayment.due_date
          })
          .eq('id', plan.id);
          
        console.log(`Updated plan next due date to ${nextPayment.due_date}`);
      }
      
      // Record the reschedule activity
      const { error: activityError } = await supabase
        .from('payment_activity')
        .insert({
          payment_link_id: plan.paymentLinkId,
          patient_id: plan.patientId,
          clinic_id: plan.clinicId,
          plan_id: plan.id,
          action_type: 'reschedule_plan',
          details: {
            plan_name: plan.title || plan.planName,
            previous_date: currentPlan.start_date,
            new_date: formattedDate,
            days_shifted: diffDays,
            payments_shifted: shiftedCount,
            payment_requests_cancelled: paymentRequestCount
          }
        });
      
      if (activityError) {
        console.error('Error logging reschedule activity:', activityError);
      }

      // Update plan status using PlanStatusService for consistency
      const statusResult = await PlanStatusService.updatePlanStatus(plan.id);
      
      if (!statusResult.success) {
        console.error('Error updating plan status after rescheduling:', statusResult.error);
      } else {
        console.log(`Plan rescheduled successfully with calculated status: ${statusResult.status}`);
      }
      
      return true;
      
    } catch (error: any) {
      console.error('Error rescheduling plan:', error);
      return false;
    }
  }
  
  /**
   * Record a refund for a payment
   * @param paymentId The payment ID to refund
   * @param amount The refund amount
   * @param isFullRefund Whether this is a full refund
   * @returns Object indicating success or failure
   */
  static async recordPaymentRefund(paymentId: string, amount: number, isFullRefund: boolean): Promise<{ success: boolean, error?: any }> {
    try {
      // Get the payment details
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('payment_link_id')
        .eq('id', paymentId)
        .single();
        
      if (paymentError) throw paymentError;
      
      // Find the payment schedule entry through payment requests if it exists
      const { data: requestsData, error: requestsError } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('payment_id', paymentId)
        .maybeSingle();
        
      if (requestsError) {
        console.warn('Could not fetch payment request:', requestsError);
      }
      
      let scheduleData = null;
      if (requestsData?.id) {
        // Look for associated payment schedule
        const { data: scheduleResult, error: scheduleError } = await supabase
          .from('payment_schedule')
          .select('plan_id')
          .eq('payment_request_id', requestsData.id)
          .maybeSingle();
          
        if (scheduleError) {
          console.warn('Could not find payment_schedule entry:', scheduleError);
        } else {
          scheduleData = scheduleResult;
        }
      }
      
      // Record the refund in payments table
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded',
          refund_amount: amount,
          refunded_at: new Date().toISOString()
        })
        .eq('id', paymentId);
        
      if (updatePaymentError) {
        throw updatePaymentError;
      }
      
      // If this payment was part of a payment plan, update the payment_schedule status
      if (scheduleData?.plan_id && requestsData?.id) {
        const { error: updateScheduleError } = await supabase
          .from('payment_schedule')
          .update({
            status: isFullRefund ? 'refunded' : 'partially_refunded',
            updated_at: new Date().toISOString()
          })
          .eq('payment_request_id', requestsData.id);
          
        if (updateScheduleError) {
          console.warn('Could not update payment schedule status:', updateScheduleError);
        }
      }
      
      // If this is part of a payment plan, record the activity
      if (scheduleData?.plan_id) {
        await recordPaymentPlanActivity({
          planId: scheduleData.plan_id,
          actionType: 'payment_refunded',
          details: {
            payment_id: paymentId,
            amount: amount,
            is_full_refund: isFullRefund,
            refunded_at: new Date().toISOString()
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error recording payment refund:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Helper function to calculate new payment dates based on frequency
   * @private
   */
  private static calculateNewPaymentDates(startDate: Date, frequency: string, count: number): string[] {
    const dates: string[] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      
      // Calculate next date based on frequency
      if (frequency === 'weekly') {
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
      } else if (frequency === 'bi-weekly') {
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 14));
      } else if (frequency === 'monthly') {
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      } else {
        // Default to monthly if frequency is unknown
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      }
    }
    
    return dates;
  }
  
  /**
   * Send a payment reminder for an installment
   * @param installmentId The installment ID to send a reminder for
   * @returns Object indicating success or failure
   */
  static async sendPaymentReminder(installmentId: string): Promise<{ success: boolean, error?: any }> {
    try {
      // Call the existing sendPaymentReminder function from PaymentReminderService
      const result = await sendPaymentReminder(installmentId);
      return result;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return { success: false, error };
    }
  }
}

// Import at the end to avoid circular dependencies
import { sendPaymentReminder } from '@/services/PaymentReminderService';
