
import { supabase } from '@/integrations/supabase/client';
import { Plan } from '@/utils/planTypes';
import { toast } from 'sonner';
import { isPaymentStatusModifiable, getModifiableStatuses } from '@/utils/paymentStatusUtils';
import { PlanStatusService } from '@/services/PlanStatusService';

/**
 * Service for performing operations on payment plans
 */
export class PlanOperationsService {
  /**
   * Cancel a payment plan
   */
  static async cancelPlan(plan: Plan): Promise<boolean> {
    try {
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
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', requestIds)
          .is('payment_id', null); // Only update requests that don't have a payment (not paid)
          
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
      
      toast.success('Payment plan cancelled successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel plan: ' + error.message);
      return false;
    }
  }
  
  /**
   * Pause a payment plan
   */
  static async pausePlan(plan: Plan): Promise<boolean> {
    try {
      // Get the current plan to ensure it exists
      const { data: planData, error: planFetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan.id)
        .single();
        
      if (planFetchError) throw planFetchError;
      
      // Find payment requests that need to be cancelled
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select('id, payment_request_id')
        .eq('plan_id', plan.id)
        .in('status', getModifiableStatuses())
        .not('payment_request_id', 'is', null);
        
      if (scheduleError) throw scheduleError;
      
      console.log('Found schedules with payment requests to cancel:', scheduleData?.length || 0);
      
      // Extract payment request IDs
      const paymentRequestIds = scheduleData
        ?.filter(item => item.payment_request_id)
        .map(item => item.payment_request_id) || [];
        
      console.log('Payment request IDs to cancel:', paymentRequestIds);
      
      // Cancel payment requests first - CHANGED: Remove the is('payment_id', null) condition
      // This ensures ALL requests get cancelled, even if they have a payment_id reference
      if (paymentRequestIds.length > 0) {
        const { data: updatedRequests, error: requestCancelError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', paymentRequestIds)
          .select();
          
        if (requestCancelError) {
          console.error('Error cancelling payment requests:', requestCancelError);
          // No longer just a warning - throw the error to stop the operation
          throw new Error(`Failed to cancel payment requests: ${requestCancelError.message}`);
        } else {
          console.log('Successfully cancelled payment requests:', updatedRequests?.length || 0);
        }
      }
      
      // After successfully cancelling requests, update payment schedules
      const { error: updateScheduleError } = await supabase
        .from('payment_schedule')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan.id)
        .in('status', getModifiableStatuses());
        
      if (updateScheduleError) throw updateScheduleError;
      
      // After payment schedules are updated, update the plan status
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);
        
      if (planUpdateError) throw planUpdateError;
      
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
      
      toast.success('Payment plan paused successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error pausing payment plan:', error);
      toast.error('Failed to pause plan: ' + error.message);
      return false;
    }
  }
  
  /**
   * Resume a paused payment plan
   */
  static async resumePlan(plan: Plan, resumeDate?: Date): Promise<boolean> {
    try {
      // If resumeDate is not provided, use current date
      const effectiveResumeDate = resumeDate || new Date();
      console.log('Resuming plan with date:', effectiveResumeDate);
      
      // Get the current paused payments to track what's being resumed
      const { data: pausedSchedules, error: fetchError } = await supabase
        .from('payment_schedule')
        .select('id, status, payment_request_id, due_date')
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
        
      if (fetchError) throw fetchError;
      
      // Count payments with payment requests that need to be reset
      let sentPaymentsCount = 0;
      const pausedPaymentIds = [];
      const paymentRequestIds = [];
      
      for (const schedule of pausedSchedules || []) {
        pausedPaymentIds.push(schedule.id);
        
        if (schedule.payment_request_id) {
          sentPaymentsCount++;
          paymentRequestIds.push(schedule.payment_request_id);
        }
      }
      
      // Reset any payment requests that were sent but not paid
      if (paymentRequestIds.length > 0) {
        const { error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .in('id', paymentRequestIds)
          .is('payment_id', null); // Only update requests that don't have a payment (not paid)
          
        if (requestUpdateError) {
          console.error('Error updating payment requests:', requestUpdateError);
        }
      }
      
      // CRITICAL CHANGE: First update previously paused payment schedules to pending status
      // This ensures they are ready to be rescheduled by the database function
      const { error: scheduleStatusUpdateError } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'pending',
          payment_request_id: null, // ALWAYS clear payment_request_id when resuming
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', plan.id)
        .eq('status', 'paused');
        
      if (scheduleStatusUpdateError) {
        console.error('Error updating payment schedule statuses:', scheduleStatusUpdateError);
        throw scheduleStatusUpdateError;
      }
      
      // Verify payments are now in pending status before proceeding
      const { count: pendingCount, error: pendingCountError } = await supabase
        .from('payment_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', plan.id)
        .eq('status', 'pending');
        
      if (pendingCountError) {
        console.error('Error verifying pending payments:', pendingCountError);
      } else {
        console.log(`Verified ${pendingCount} payments now in pending status`);
        
        if (pendingCount === 0) {
          console.warn('No pending payments found after status update - this may cause issues with the rescheduling');
        }
      }
      
      // Format date as YYYY-MM-DD for the database function call
      const formattedDate = effectiveResumeDate.toISOString().split('T')[0]; 
      console.log('Calling resume_payment_plan with formatted date:', formattedDate);
      
      // Set a temporary status on plan to indicate we're processing
      const { error: planUpdateError } = await supabase
        .from('plans')
        .update({ 
          status: 'pending', // Temporary status, will be recalculated
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);
      
      if (planUpdateError) throw planUpdateError;
      
      // AFTER updating schedules to pending, call the resume_payment_plan RPC function
      const { data: schedulingResult, error: schedulingError } = await supabase
        .rpc('resume_payment_plan', { 
          plan_id: plan.id,
          resume_date: formattedDate
        });
      
      if (schedulingError) {
        console.error('Error rescheduling payments:', schedulingError);
        throw schedulingError; // Escalate error to ensure we don't proceed with bad data
      } else {
        console.log('Rescheduling result:', schedulingResult);
      }

      // Verify that the payments have been rescheduled
      const { data: updatedPayments, error: updatedPaymentsError } = await supabase
        .from('payment_schedule')
        .select('id, due_date, status')
        .eq('plan_id', plan.id)
        .order('due_date', { ascending: true });
        
      if (updatedPaymentsError) {
        console.error('Error fetching updated payments:', updatedPaymentsError);
      } else {
        console.log('Updated payment schedule:', updatedPayments);
      }
      
      // Add an activity log entry with detailed information
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
            resume_date: effectiveResumeDate.toISOString(),
            installments_affected: (pausedSchedules?.length || 0),
            sent_payments_reset: sentPaymentsCount,
            days_shifted: schedulingResult ? 
              (typeof schedulingResult === 'object' && 'days_shifted' in schedulingResult ? 
                schedulingResult.days_shifted : 0) : 0
          }
        });
      
      // CRITICAL: Calculate the correct plan status based on payments
      // This is now our single source of truth
      const result = await PlanStatusService.updatePlanStatus(plan.id);
      
      if (!result.success) {
        console.error('Error updating plan status after resume:', result.error);
        throw new Error('Failed to update plan status');
      }
      
      console.log(`Plan resumed successfully with calculated status: ${result.status}`);
      
      toast.success('Payment plan resumed successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume plan: ' + error.message);
      return false;
    }
  }
  
  /**
   * Reschedule a payment plan with a new start date
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
      
      // Cancel active payment requests since dates will change - CHANGED: remove is('payment_id', null) condition
      // to ensure ALL requests get cancelled
      if (paymentRequestIds.length > 0) {
        const { data: updatedRequests, error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled', 
            updated_at: new Date().toISOString()
          })
          .in('id', paymentRequestIds)
          .select();
          
        if (requestUpdateError) {
          console.error('Error updating payment requests:', requestUpdateError);
          // Now throwing an error to stop the operation if request cancellation fails
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
      
      toast.success('Payment plan rescheduled successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error rescheduling plan:', error);
      toast.error('Failed to reschedule plan: ' + error.message);
      return false;
    }
  }
}
