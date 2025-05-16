
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getModifiableStatuses } from '@/utils/paymentStatusUtils';

/**
 * Service for handling plan rescheduling operations
 */
export class PlanRescheduleService {
  /**
   * Reschedule a payment plan with a new start date
   * @param plan The plan to reschedule
   * @param newStartDate The new start date for the plan
   * @returns boolean indicating success or failure
   */
  static async reschedulePlan(plan: Plan, newStartDate: Date): Promise<boolean> {
    try {
      // Format date as YYYY-MM-DD using date-fns format which preserves the date regardless of timezone
      const formattedDate = format(newStartDate, 'yyyy-MM-dd');
      console.log('Rescheduling plan with formatted date:', formattedDate);
      
      // Get the current plan to calculate days difference
      const { data: currentPlan, error: planError } = await supabase
        .from('plans')
        .select('start_date, status')
        .eq('id', plan.id)
        .single();
      
      if (planError) throw planError;
      
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
      const paymentRequestIds: string[] = [];
      
      // Get all modifiable schedule entries
      const { data: scheduleEntries, error: scheduleError } = await supabase
        .from('payment_schedule')
        .select('id, payment_request_id, status, due_date')
        .eq('plan_id', plan.id)
        .in('status', getModifiableStatuses())
        .order('due_date', { ascending: true });
        
      if (scheduleError) throw scheduleError;
      
      console.log(`Found ${scheduleEntries?.length || 0} modifiable payment schedules`);
      
      // Identify payment requests to cancel
      if (scheduleEntries) {
        for (const entry of scheduleEntries) {
          if (entry.payment_request_id) {
            paymentRequestIds.push(entry.payment_request_id);
            paymentRequestCount++;
          }
        }
      }
      
      console.log(`Found ${paymentRequestIds.length} payment requests to cancel`);
      
      // Cancel active payment requests since dates will change
      if (paymentRequestIds.length > 0) {
        const { data: updatedRequests, error: requestUpdateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'cancelled'
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
      
      // Get payment frequency to calculate new dates
      const { data: planData, error: planFrequencyError } = await supabase
        .from('plans')
        .select('payment_frequency')
        .eq('id', plan.id)
        .single();
        
      if (planFrequencyError) throw planFrequencyError;
      
      const paymentFrequency = planData.payment_frequency;
      
      // Calculate payment interval
      let paymentInterval: number;
      switch (paymentFrequency) {
        case 'weekly':
          paymentInterval = 7; // 7 days
          break;
        case 'bi-weekly':
          paymentInterval = 14; // 14 days
          break;
        case 'monthly':
        default:
          paymentInterval = 30; // ~1 month
          break;
      }
      
      // Update modifiable payment schedules using the new date as the starting point
      if (scheduleEntries && scheduleEntries.length > 0) {
        let shiftedCount = 0;
        
        // Set the first modifiable payment to the exact new start date
        const { error: firstPaymentUpdateError } = await supabase
          .from('payment_schedule')
          .update({
            due_date: formattedDate, // Using the formatted date string directly
            status: 'pending', // Reset status to pending
            payment_request_id: null, // Clear any payment request associations
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduleEntries[0].id);
          
        if (firstPaymentUpdateError) {
          console.error('Error updating first payment due date:', firstPaymentUpdateError);
        } else {
          shiftedCount++;
        }
        
        // Calculate subsequent payment dates based on the payment frequency
        for (let i = 1; i < scheduleEntries.length; i++) {
          const newDueDate = new Date(newStartDate);
          newDueDate.setDate(newDueDate.getDate() + (i * paymentInterval));
          
          // Use format consistently to convert to string and prevent timezone issues
          const formattedDueDate = format(newDueDate, 'yyyy-MM-dd');
          
          const { error: dueDateUpdateError } = await supabase
            .from('payment_schedule')
            .update({
              due_date: formattedDueDate, // Using formatted date string
              status: 'pending', // Reset status to pending
              payment_request_id: null, // Clear any payment request associations
              updated_at: new Date().toISOString()
            })
            .eq('id', scheduleEntries[i].id);
            
          if (dueDateUpdateError) {
            console.error('Error updating due date:', dueDateUpdateError);
          } else {
            shiftedCount++;
          }
        }
        
        console.log(`Successfully shifted ${shiftedCount} payment schedules`);
      }
      
      // Update the plan's next_due_date to the new start date
      const { error: nextDueDateUpdateError } = await supabase
        .from('plans')
        .update({
          next_due_date: formattedDate // Using formatted date string
        })
        .eq('id', plan.id);
        
      if (nextDueDateUpdateError) {
        console.error('Error updating next due date:', nextDueDateUpdateError);
      } else {
        console.log(`Updated plan next due date to ${formattedDate}`);
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
            new_date: formattedDate, // Using formatted date string
            payments_shifted: scheduleEntries?.length || 0,
            payment_requests_cancelled: paymentRequestCount
          }
        });
      
      if (activityError) {
        console.error('Error logging reschedule activity:', activityError);
      }

      return true;
      
    } catch (error: any) {
      console.error('Error rescheduling plan:', error);
      return false;
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
}
