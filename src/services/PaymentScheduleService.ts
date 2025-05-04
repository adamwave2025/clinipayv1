import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlanActivityType } from '@/utils/planActivityUtils';

export const fetchUserClinicId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.clinic_id;
  } catch (error) {
    console.error('Error fetching user clinic ID:', error);
    return null;
  }
};

export const fetchPaymentSchedules = async (clinicId: string) => {
  const { data, error } = await supabase
    .from('payment_schedule')
    .select(`
      *,
      payment_requests (*),
      patients (
        id,
        name,
        email,
        phone
      ),
      payment_links (
        id,
        title,
        amount,
        plan_total_amount
      )
    `)
    .eq('clinic_id', clinicId)
    .order('payment_number', { ascending: true });

  if (error) {
    console.error('Error fetching payment schedules:', error);
    throw error;
  }

  return data || [];
};

export const fetchPlansForClinic = async (clinicId: string) => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone
        ),
        payment_links (
          id,
          title,
          amount,
          description,
          plan_total_amount
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }

    // Add patient name from the joined patients table
    return data.map(plan => ({
      ...plan,
      patient_name: plan.patients?.name || 'Unknown Patient'
    }));
  } catch (error) {
    console.error('Error in fetchPlansForClinic:', error);
    return [];
  }
};

export const fetchPlanInstallments = async (planId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_schedule')
      .select(`
        id,
        amount,
        due_date,
        payment_number,
        total_payments,
        status,
        payment_request_id,
        payment_requests (
          id,
          payment_id,
          paid_at,
          status
        )
      `)
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching plan installments:', error);
    toast.error('Failed to load payment details');
    return [];
  }
};

export const fetchPlanActivities = async (planId: string) => {
  try {
    // First get the plan details to retrieve patient_id and payment_link_id
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('patient_id, payment_link_id')
      .eq('id', planId)
      .single();
      
    if (planError) throw planError;
    
    const { data, error } = await supabase
      .from('payment_plan_activities')
      .select('*')
      .eq('patient_id', plan.patient_id)
      .eq('payment_link_id', plan.payment_link_id)
      .order('performed_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching plan activities:', error);
    return [];
  }
};

export const recordPaymentPlanActivity = async (
  planId: string,
  actionType: PlanActivityType,
  details: any,
  userId?: string
) => {
  try {
    // Get plan details first
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('patient_id, payment_link_id, clinic_id')
      .eq('id', planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan for activity recording:', planError);
      return { success: false, error: planError };
    }
    
    const { data, error } = await supabase
      .from('payment_plan_activities')
      .insert({
        patient_id: plan.patient_id,
        payment_link_id: plan.payment_link_id,
        clinic_id: plan.clinic_id,
        action_type: actionType,
        performed_by_user_id: userId,
        details: { ...details, plan_id: planId }
      })
      .select();
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error recording payment plan activity:', error);
    return { success: false, error };
  }
};

/**
 * Helper function to determine if an installment has been paid
 * Checks for valid payment_request_id and completed payment
 */
const isPlanInstallmentPaid = (entry: any): boolean => {
  // Check if the payment_request_id exists and payment_id exists in the payment_requests object
  const isPaid = (entry.status === 'sent' || entry.status === 'processed' || entry.status === 'paid') && 
                 entry.payment_request_id !== null && 
                 entry.payment_requests !== null &&
                 entry.payment_requests.payment_id !== null;
  
  return isPaid;
};

export const cancelPaymentPlan = async (planId: string, userId?: string) => {
  try {
    // Get plan details first
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('patient_id, payment_link_id, clinic_id')
      .eq('id', planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan for cancellation:', planError);
      return { success: false, error: planError };
    }

    // Get all installments to find which ones can be cancelled
    const { data: installments, error: installmentsError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        payment_number, 
        status, 
        payment_request_id,
        payment_requests (
          payment_id,
          status
        )
      `)
      .eq('plan_id', planId);

    if (installmentsError) throw installmentsError;

    // Filter out payments that have already been processed/paid
    const cancellableInstallments = installments.filter(installment => !isPlanInstallmentPaid(installment));
    
    if (cancellableInstallments.length === 0) {
      return { success: true, message: "No installments available to cancel" };
    }
    
    // Get IDs of cancellable installments
    const cancellableIds = cancellableInstallments.map(item => item.id);
    
    // Update only cancellable installments to 'cancelled'
    const { data, error } = await supabase
      .from('payment_schedule')
      .update({ status: 'cancelled' })
      .in('id', cancellableIds)
      .select();

    if (error) throw error;
    
    // Also update the plan status to cancelled
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({ status: 'cancelled' })
      .eq('id', planId);
      
    if (planUpdateError) {
      console.error('Error updating plan status:', planUpdateError);
    }
    
    // Record the activity
    await recordPaymentPlanActivity(
      planId,
      'cancel',
      { 
        installments_affected: data.length,
        reason: 'User cancelled plan'
      },
      userId
    );
    
    return { success: true, data };
  } catch (error) {
    console.error('Error cancelling payment plan:', error);
    toast.error('Failed to cancel payment plan');
    return { success: false, error };
  }
};

export const pausePaymentPlan = async (planId: string, userId?: string) => {
  try {
    // Get plan details first
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('patient_id, payment_link_id, clinic_id')
      .eq('id', planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan for pausing:', planError);
      return { success: false, error: planError };
    }
    
    // Get all installments to find which ones are pausable
    const { data: allInstallments, error: fetchError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        payment_number, 
        status, 
        payment_request_id, 
        due_date,
        payment_requests (
          payment_id,
          status
        )
      `)
      .eq('plan_id', planId);

    if (fetchError) throw fetchError;
    
    // Filter out payments that have already been processed/paid
    const pausableInstallments = allInstallments.filter(installment => !isPlanInstallmentPaid(installment));
    
    if (pausableInstallments.length === 0) {
      return { success: true, message: "No installments available to pause" };
    }
    
    // Get IDs of pausable installments
    const pausableIds = pausableInstallments.map(item => item.id);
    
    // Update only pausable installments to 'paused'
    const { data, error } = await supabase
      .from('payment_schedule')
      .update({ status: 'paused' })
      .in('id', pausableIds)
      .select();

    if (error) throw error;
    
    // Also update the plan status to paused
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({ status: 'paused' })
      .eq('id', planId);
      
    if (planUpdateError) {
      console.error('Error updating plan status:', planUpdateError);
    }
    
    // Record the activity
    await recordPaymentPlanActivity(
      planId,
      'pause',
      { 
        installments_affected: data.length,
        instalments_paused: data.map(item => ({
          id: item.id,
          payment_number: item.payment_number,
          due_date: item.due_date
        }))
      },
      userId
    );
    
    return { success: true, data };
  } catch (error) {
    console.error('Error pausing payment plan:', error);
    toast.error('Failed to pause payment plan');
    return { success: false, error };
  }
};

export const resumePaymentPlan = async (planId: string, resumeDate: Date, userId?: string) => {
  try {
    console.log('Original resumeDate received:', resumeDate);
    
    // Get plan details first
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('patient_id, payment_link_id, clinic_id, payment_frequency')
      .eq('id', planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan for resuming:', planError);
      return { success: false, error: planError };
    }
    
    // Get all installments for this plan to properly handle the sequence
    const { data: allInstallments, error: fetchAllError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        payment_number, 
        payment_frequency, 
        due_date,
        status,
        payment_request_id,
        payment_requests (
          payment_id,
          status,
          paid_at
        )
      `)
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
    
    if (fetchAllError) throw fetchAllError;
    
    // 1. Find all paid installments
    const paidInstallments = allInstallments.filter(installment => isPlanInstallmentPaid(installment));
    
    // 2. Find all paused installments that need to be resumed
    const pausedInstallments = allInstallments.filter(installment => 
      installment.status === 'paused' && !isPlanInstallmentPaid(installment)
    );
    
    if (pausedInstallments.length === 0) {
      return { success: true, message: 'No paused installments found' };
    }
    
    // Keep track of original and new due dates for audit
    const dueChanges = [];
    
    // Calculate new due dates for each paused installment
    const frequency = plan.payment_frequency || 'monthly';
    
    // Find the last paid installment to start scheduling from
    let startDate = new Date(resumeDate);
    if (paidInstallments.length > 0) {
      // Sort paid installments by payment number to find the latest one
      const sortedPaidInstallments = [...paidInstallments].sort((a, b) => 
        b.payment_number - a.payment_number
      );
      
      console.log('Last paid installment:', sortedPaidInstallments[0]);
    }
    
    // Reset startDate time to beginning of day to avoid timezone issues
    startDate.setHours(0, 0, 0, 0);
    
    const updatePromises = pausedInstallments.map((installment, index) => {
      // Calculate new due date based on the resume date and installment index
      const newDueDate = calculateNewDueDate(startDate, index, frequency);
      
      // Format date using YYYY-MM-DD format to avoid timezone issues
      const formattedDate = formatDateToYYYYMMDD(newDueDate);
      
      // Track changes for audit
      dueChanges.push({
        installment_id: installment.id,
        payment_number: installment.payment_number,
        old_due_date: installment.due_date,
        new_due_date: formattedDate
      });
      
      console.log(`Resuming installment ${installment.payment_number}, new due date: ${formattedDate}`);
      
      return supabase
        .from('payment_schedule')
        .update({ 
          status: 'pending',
          due_date: formattedDate
        })
        .eq('id', installment.id);
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Also update the plan status to active
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({ 
        status: 'active',
        next_due_date: formatDateToYYYYMMDD(startDate)
      })
      .eq('id', planId);
      
    if (planUpdateError) {
      console.error('Error updating plan status:', planUpdateError);
    }
    
    // Record the activity
    await recordPaymentPlanActivity(
      planId,
      'resume',
      { 
        installments_affected: pausedInstallments.length,
        resume_date: formatDateToYYYYMMDD(resumeDate),
        schedule_changes: dueChanges
      },
      userId
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error resuming payment plan:', error);
    toast.error('Failed to resume payment plan');
    return { success: false, error };
  }
};

export const reschedulePaymentPlan = async (
  planId: string, 
  newStartDate: Date,
  userId?: string
) => {
  try {
    console.log('Original newStartDate received:', newStartDate);
    
    // Get plan details first
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('patient_id, payment_link_id, clinic_id, payment_frequency')
      .eq('id', planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan for rescheduling:', planError);
      return { success: false, error: planError };
    }
    
    // Get all installments for this plan to properly handle the sequence
    const { data: allInstallments, error: fetchAllError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        payment_number, 
        payment_frequency,
        due_date,
        status,
        payment_request_id,
        amount,
        payment_requests (
          id,
          payment_id,
          status
        )
      `)
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
    
    if (fetchAllError) throw fetchAllError;
    
    if (!allInstallments || allInstallments.length === 0) {
      return { success: true, message: 'No installments found for rescheduling' };
    }
    
    // Separate paid and unpaid installments
    const paidInstallments = allInstallments.filter(item => isPlanInstallmentPaid(item));
    const unpaidInstallments = allInstallments.filter(item => !isPlanInstallmentPaid(item));
    
    if (unpaidInstallments.length === 0) {
      return { success: true, message: 'No unpaid installments found to reschedule' };
    }
    
    // Track all changes for audit log
    const changes = {
      original_dates: {},
      new_dates: {},
      sent_payment_requests_cancelled: []
    };
    
    // First, collect all payment_request_ids that need to be cancelled
    const paymentRequestIds = unpaidInstallments
      .filter(item => item.payment_request_id !== null && !isPlanInstallmentPaid(item))
      .map(item => item.payment_request_id);
    
    // Cancel all related payment requests in a single update operation
    if (paymentRequestIds.length > 0) {
      console.log(`Attempting to cancel payment requests: ${paymentRequestIds.join(', ')}`);
      
      const { data: cancelledRequests, error: cancelBatchError } = await supabase
        .from('payment_requests')
        .update({ status: 'cancelled' })
        .in('id', paymentRequestIds)
        .select('id');
      
      if (cancelBatchError) {
        console.error('Error cancelling payment requests batch:', cancelBatchError);
        // Continue with the workflow even if there's an error here
      } else {
        changes.sent_payment_requests_cancelled = cancelledRequests.map(req => req.id);
        console.log(`Successfully cancelled ${cancelledRequests.length} payment requests:`, cancelledRequests);
      }
    } else {
      console.log('No payment requests to cancel');
    }
    
    // Calculate new due dates for each unpaid installment
    const frequency = plan.payment_frequency || 'monthly';
    
    // Start date for new schedule should be the provided new start date
    // Reset to beginning of day to avoid timezone issues
    const startDate = new Date(newStartDate);
    startDate.setHours(0, 0, 0, 0);
    
    // Process each unpaid installment
    const updatePromises = unpaidInstallments.map(async (installment, index) => {
      // Calculate new due date based on the new start date and installment index
      const newDueDate = calculateNewDueDate(startDate, index, frequency);
      const formattedDate = formatDateToYYYYMMDD(newDueDate);
      
      // Track original and new date for audit
      changes.original_dates[installment.id] = installment.due_date;
      changes.new_dates[installment.id] = formattedDate;
      
      console.log(`Installment ${installment.payment_number}, new due date: ${formattedDate}`);
      
      // Update the installment with new due date and reset to pending status
      return supabase
        .from('payment_schedule')
        .update({ 
          due_date: formattedDate,
          status: 'pending',  // Reset to pending since we've cancelled any existing requests
          payment_request_id: null  // Clear the payment request reference
        })
        .eq('id', installment.id);
    });
    
    // Wait for all updates to complete
    const updateResults = await Promise.all(updatePromises);
    console.log('Update results:', updateResults);
    
    // Update the plan with the new start date and next due date
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({ 
        start_date: formatDateToYYYYMMDD(startDate),
        next_due_date: formatDateToYYYYMMDD(startDate),
        status: 'active'
      })
      .eq('id', planId);
      
    if (planUpdateError) {
      console.error('Error updating plan details:', planUpdateError);
    }
    
    // Record the activity
    await recordPaymentPlanActivity(
      planId,
      'reschedule',
      { 
        installments_affected: unpaidInstallments.length,
        paid_installments_unaffected: paidInstallments.length,
        new_start_date: formatDateToYYYYMMDD(newStartDate),
        changes: changes
      },
      userId
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error rescheduling payment plan:', error);
    toast.error('Failed to reschedule payment plan');
    return { success: false, error };
  }
};

// Helper function to calculate new due date based on frequency
function calculateNewDueDate(startDate: Date, index: number, frequency: string): Date {
  // Create a new date object to avoid mutating the original date
  const newDate = new Date(startDate);
  
  // Ensure the date is set to the start of the day to avoid timezone issues
  newDate.setHours(0, 0, 0, 0);
  
  console.log(`Index: ${index}, Original date: ${newDate.toISOString()}, Local date: ${formatDateToYYYYMMDD(newDate)}`);
  
  switch (frequency) {
    case 'daily':
      newDate.setDate(newDate.getDate() + index);
      break;
    case 'weekly':
      newDate.setDate(newDate.getDate() + (index * 7));
      break;
    case 'biweekly':
      newDate.setDate(newDate.getDate() + (index * 14));
      break;
    case 'monthly':
      newDate.setMonth(newDate.getMonth() + index);
      break;
    case 'quarterly':
      newDate.setMonth(newDate.getMonth() + (index * 3));
      break;
    case 'yearly':
      newDate.setFullYear(newDate.getFullYear() + index);
      break;
    default:
      newDate.setMonth(newDate.getMonth() + index);
  }
  
  console.log(`After calculation: ${newDate.toISOString()}, Local date: ${formatDateToYYYYMMDD(newDate)}`);
  
  return newDate;
}

// Helper function to format date as YYYY-MM-DD
function formatDateToYYYYMMDD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Record a payment refund in the payment plan system
 * Updates the payment_schedule status and records the activity
 */
export const recordPaymentRefund = async (
  paymentId: string,
  refundAmount: number,
  isFullRefund: boolean,
  userId?: string
) => {
  try {
    // First, find the payment request associated with this payment
    const { data: paymentRequest, error: paymentRequestError } = await supabase
      .from('payment_requests')
      .select('id, patient_id, payment_link_id, clinic_id')
      .eq('payment_id', paymentId)
      .single();
      
    if (paymentRequestError) {
      console.error('Error finding payment request for refund:', paymentRequestError);
      return { success: false, error: paymentRequestError.message };
    }
    
    if (!paymentRequest) {
      console.log('No payment request found for this payment');
      return { success: false, error: 'No payment request found for this payment' };
    }
    
    // Find the payment schedule entry associated with this payment request
    const { data: scheduleEntry, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        plan_id,
        payment_number, 
        total_payments, 
        amount,
        due_date,
        payment_requests (
          id,
          payment_id,
          status,
          patient_name
        )
      `)
      .eq('payment_request_id', paymentRequest.id)
      .single();
      
    if (scheduleError) {
      console.error('Error finding schedule entry for refund:', scheduleError);
      return { success: false, error: scheduleError.message };
    }
    
    if (!scheduleEntry) {
      console.log('No schedule entry found for this payment request');
      return { success: false, error: 'No schedule entry found for this payment request' };
    }
    
    console.log('Found schedule entry:', scheduleEntry);
    
    // Get payment details for the activity log
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
      
    if (paymentError) {
      console.error('Error fetching payment details:', paymentError);
      // Continue without payment details
    }
    
    // Update the schedule entry status based on refund type
    const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    
    const { error: updateError } = await supabase
      .from('payment_schedule')
      .update({ status: newStatus })
      .eq('id', scheduleEntry.id);
      
    if (updateError) {
      console.error('Error updating schedule status:', updateError);
      return { success: false, error: updateError.message };
    }
    
    // If this is part of a plan, update the plan statistics
    if (scheduleEntry.plan_id) {
      // Get current plan data
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('paid_installments, progress')
        .eq('id', scheduleEntry.plan_id)
        .single();
        
      if (!planError && planData) {
        // Decrement paid_installments counter if it was a full refund
        if (isFullRefund) {
          const newPaidInstallments = Math.max(0, planData.paid_installments - 1);
          const newProgress = Math.round((newPaidInstallments / scheduleEntry.total_payments) * 100);
          
          // Update plan data
          await supabase
            .from('plans')
            .update({ 
              paid_installments: newPaidInstallments,
              progress: newProgress,
              // If all installments were paid before and now one is refunded, revert to active
              status: planData.progress === 100 ? 'active' : undefined
            })
            .eq('id', scheduleEntry.plan_id);
        }
      }
    }
    
    // Record the refund activity
    const activityDetails = {
      plan_id: scheduleEntry.plan_id,
      payment_number: scheduleEntry.payment_number,
      total_payments: scheduleEntry.total_payments,
      refund_amount: refundAmount,
      is_full_refund: isFullRefund,
      payment_reference: payment?.payment_ref || '',
      refund_date: new Date().toISOString(),
      original_amount: scheduleEntry.amount / 100 // Convert cents to dollars/pounds
    };
    
    // If we have a plan ID, use the new activity recording function
    if (scheduleEntry.plan_id) {
      await recordPaymentPlanActivity(
        scheduleEntry.plan_id,
        'payment_refund',
        activityDetails,
        userId
      );
    } else {
      // Fall back to the old method
      await supabase
        .from('payment_plan_activities')
        .insert({
          patient_id: paymentRequest.patient_id,
          payment_link_id: paymentRequest.payment_link_id,
          clinic_id: paymentRequest.clinic_id,
          action_type: 'payment_refund',
          details: activityDetails,
          performed_by_user_id: userId
        });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error recording payment refund:', error);
    return { success: false, error: String(error) };
  }
};
