import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plan } from '@/utils/planTypes';
import { PlanStatusService } from '@/services/PlanStatusService';

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
    // Use the new plan_id column to directly fetch activities for this plan
    const { data, error } = await supabase
      .from('payment_activity')
      .select('*')
      .eq('plan_id', planId)
      .order('performed_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching plan activities:', error);
    return [];
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

export const recordPaymentPlanActivity = async (
  patientIdOrPlanId: string | null,
  paymentLinkIdOrActionType: string,
  clinicIdOrDetails: string | any = {},
  actionTypeOrUserId?: string,
  details?: any
) => {
  // Check if this is a call using the new signature (planId, actionType, details, userId?)
  if (actionTypeOrUserId === undefined && typeof clinicIdOrDetails !== 'string') {
    // New signature: (planId, actionType, details?, userId?)
    return recordPlanActivity(patientIdOrPlanId as string, paymentLinkIdOrActionType as PlanActivityType, clinicIdOrDetails);
  }
  
  // Old signature: (patientId, paymentLinkId, clinicId, actionType, details?)
  return recordPlanActivityLegacy(
    patientIdOrPlanId, 
    paymentLinkIdOrActionType, 
    clinicIdOrDetails as string, 
    actionTypeOrUserId as string, 
    details
  );
};

// Implementation for the new signature
async function recordPlanActivity(
  planId: string,
  actionType: PlanActivityType,
  details: any = {},
  userId?: string
) {
  try {
    // First get the plan details to retrieve patient_id and payment_link_id
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('patient_id, payment_link_id, clinic_id')
      .eq('id', planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan details for activity:', planError);
      return { success: false };
    }
    
    const { data, error } = await supabase
      .from('payment_activity')
      .insert({
        patient_id: plan.patient_id,
        payment_link_id: plan.payment_link_id,
        clinic_id: plan.clinic_id,
        plan_id: planId, // Now storing the plan_id directly
        action_type: actionType,
        details: details,
        performed_by_user_id: userId || (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) {
      console.error('Error recording plan activity:', error);
    }
    
    return { success: !error };
  } catch (error) {
    console.error('Error recording plan activity:', error);
    return { success: false };
  }
}

// Implementation for the legacy signature
async function recordPlanActivityLegacy(
  patientId: string | null,
  paymentLinkId: string,
  clinicId: string,
  actionType: string,
  details: any = {}
) {
  try {
    // Try to find the associated plan for this patient and payment link
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('patient_id', patientId || '00000000-0000-0000-0000-000000000000')
      .eq('payment_link_id', paymentLinkId)
      .maybeSingle();
    
    // Record the activity with plan_id if found
    const { data, error } = await supabase
      .from('payment_activity')
      .insert({
        patient_id: patientId || '00000000-0000-0000-0000-000000000000',
        payment_link_id: paymentLinkId,
        clinic_id: clinicId,
        plan_id: planData?.id || null, // Add plan_id if found
        action_type: actionType,
        details: details,
        performed_by_user_id: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) {
      console.error('Error recording payment plan activity (legacy):', error);
    }
    
    return { success: !error };
  } catch (error) {
    console.error('Error recording payment plan activity (legacy):', error);
    return { success: false };
  }
}

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
      .update({ 
        status: 'paused',
        next_due_date: null // Clear next_due_date when plan is paused
      })
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

export const resumePaymentPlan = async (planId: string, resumeDate: Date) => {
  try {
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) {
      console.error('Error fetching plan details:', planError);
      throw planError;
    }
    
    // Use the PlanOperationsService to handle the resume
    const success = await PlanOperationsService.resumePlan(plan, resumeDate);
    
    // Return the result
    return { success };
  } catch (error) {
    console.error('Error in resumePaymentPlan:', error);
    return { success: false, error };
  }
};

/**
 * Helper function to determine the correct plan status based on payment history
 */
async function determinePlanStatus(planId: string, unpaidInstallments: any[]): Promise<string> {
  try {
    console.log(`Determining status for plan ${planId}...`);
    
    // First get all installments for this plan
    const { data: allInstallments, error: fetchError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        payment_number, 
        status,
        payment_request_id,
        payment_requests (
          id,
          payment_id,
          status
        )
      `)
      .eq('plan_id', planId);
      
    if (fetchError) {
      console.error('Error fetching installments for plan status check:', fetchError);
      return 'pending'; // Default if error
    }
    
    // Count paid installments - an installment is paid if it has a payment_id in its payment_request
    const paidInstallments = allInstallments.filter(item => 
      item.payment_request_id !== null && 
      item.payment_requests !== null &&
      item.payment_requests.payment_id !== null
    );
    
    const paidCount = paidInstallments.length;
    console.log(`Found ${paidCount} paid installments out of ${allInstallments.length} total`);
    
    // Check if any installments are already overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hasOverduePayments = unpaidInstallments.some(installment => {
      const dueDate = new Date(installment.due_date);
      return dueDate < today;
    });
    
    // Determine status based on payment history and overdue status
    let newStatus;
    if (hasOverduePayments) {
      newStatus = 'overdue';
    } else if (paidCount > 0) {
      newStatus = 'active';
    } else {
      newStatus = 'pending';
    }
    
    console.log(`Determined plan status: ${newStatus} (overdue: ${hasOverduePayments}, paid: ${paidCount})`);
    return newStatus;
  }
  catch (error) {
    console.error('Error determining plan status:', error);
    return 'pending'; // Default to pending on error
  }
}

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
      .select('patient_id, payment_link_id, clinic_id, payment_frequency, status')
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
    
    console.log(`Plan has ${paidInstallments.length} paid installments and ${unpaidInstallments.length} unpaid installments`);
    
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
    
    // Determine the appropriate plan status based on payment history and due dates
    const newStatus = await determinePlanStatus(planId, unpaidInstallments);
    console.log(`Determined new plan status after rescheduling: ${newStatus}`);
    
    // Update the plan with the new start date and next due date
    const { error: planUpdateError } = await supabase
      .from('plans')
      .update({ 
        start_date: formatDateToYYYYMMDD(startDate),
        next_due_date: formatDateToYYYYMMDD(startDate),
        status: newStatus
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
        new_status: newStatus,
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
    // Find the payment request associated with this payment
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
            
          // Update the next_due_date as well
          await updatePlanNextDueDate(scheduleEntry.plan_id);
        }
      }
    }
    
    // Create a new activity record for the refund
    const { error: activityError } = await supabase
      .from('payment_activity')  // Updated table name here
      .insert({
        patient_id: paymentRequest.patient_id,
        payment_link_id: paymentRequest.payment_link_id,
        clinic_id: paymentRequest.clinic_id,
        plan_id: scheduleEntry?.plan_id || null, // Add plan_id from schedule entry
        action_type: 'payment_refund',
        details: {
          refund_date: new Date().toISOString(),
          refund_amount: refundAmount,
          is_full_refund: isFullRefund,
          payment_id: paymentId,
          // Add these if scheduleEntry was found successfully
          ...(scheduleEntry && {
            payment_number: scheduleEntry.payment_number,
            total_payments: scheduleEntry.total_payments,
            patient_name: scheduleEntry.payment_requests?.patient_name
          })
        },
        performed_by_user_id: userId || (await supabase.auth.getUser()).data.user?.id
      });
    
    if (activityError) {
      console.error('Warning: Failed to record refund activity:', activityError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error recording payment refund:', error);
    return { success: false, error: 'Failed to record payment refund' };
  }
};

// Fetch plans from the plans table
export const fetchPlans = async (userId: string) => {
  try {
    // First get the clinic ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return [];
    }

    const clinicId = userData.clinic_id;
    
    // Fetch plans from the plans table
    const { data: plans, error: plansError } = await supabase
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
          payment_count,
          payment_cycle,
          plan_total_amount
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return [];
    }
    
    // Convert to Plan objects using the formatPlanFromDb function
    return plans.map(plan => formatPlanFromDb(plan));
  } catch (error) {
    console.error('Error in fetchPlans:', error);
    return [];
  }
};

/**
 * Update the next_due_date for a plan based on the payment schedule
 * @param planId The ID of the plan to update
 * @returns {Promise<boolean>} Success status
 */
export const updatePlanNextDueDate = async (planId: string): Promise<boolean> => {
  try {
    // Get all installments for the plan, sorted by due_date
    const { data: installments, error: fetchError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
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
      .order('due_date', { ascending: true });
      
    if (fetchError) {
      console.error('Error fetching installments:', fetchError);
      return false;
    }
    
    if (!installments || installments.length === 0) {
      console.log('No installments found for plan:', planId);
      return false;
    }
    
    // Find the next unpaid installment
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Helper function to determine if an installment has been paid
    const isPaid = (item: any) => {
      return (item.status === 'sent' || item.status === 'processed' || item.status === 'paid') && 
             item.payment_request_id !== null && 
             item.payment_requests !== null &&
             item.payment_requests.payment_id !== null;
    };
    
    // Find unpaid installments
    const unpaidInstallments = installments
      .filter(item => !isPaid(item) && item.status !== 'cancelled' && item.status !== 'paused')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    
    // If all installments are paid, there's no next due date
    if (unpaidInstallments.length === 0) {
      // All paid or cancelled, update plan with null next_due_date
      const { error: updateError } = await supabase
        .from('plans')
        .update({ next_due_date: null })
        .eq('id', planId);
        
      if (updateError) {
        console.error('Error updating plan next_due_date to null:', updateError);
        return false;
      }
      
      return true;
    }
    
    // Get the earliest unpaid installment
    const nextInstallment = unpaidInstallments[0];
    const nextDueDate = nextInstallment.due_date;
    
    // Update the plan with the new next_due_date
    const { error: updateError } = await supabase
      .from('plans')
      .update({ next_due_date: nextDueDate })
      .eq('id', planId);
      
    if (updateError) {
      console.error('Error updating plan next_due_date:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating plan next_due_date:', error);
    return false;
  }
};

// Add function to recalculate next due dates for existing plans
export const recalculateAllPlanDueDates = async () => {
  try {
    // Fetch all active plans
    const { data: plans, error: planError } = await supabase
      .from('plans')
      .select('id')
      .in('status', ['active', 'pending', 'overdue']);
      
    if (planError) {
      console.error('Error fetching plans for recalculation:', planError);
      return { success: false };
    }
    
    if (!plans || plans.length === 0) {
      console.log('No plans found for recalculation');
      return { success: true, count: 0 };
    }
    
    // Update each plan's next_due_date
    const updatePromises = plans.map(plan => updatePlanNextDueDate(plan.id));
    await Promise.all(updatePromises);
    
    return { success: true, count: plans.length };
  } catch (error) {
    console.error('Error recalculating plan due dates:', error);
    return { success: false, error };
  }
};

export const updatePaymentStatus = async (paymentId: string, newStatus: string) => {
  try {
    // Get the payment to ensure we have the plan_id
    const { data: payment, error: paymentError } = await supabase
      .from('payment_schedule')
      .select('plan_id, status')
      .eq('id', paymentId)
      .single();
    
    if (paymentError) throw paymentError;
    
    if (payment.status === newStatus) {
      // No change needed
      return { success: true };
    }
    
    // Update the payment status
    const { error: updateError } = await supabase
      .from('payment_schedule')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    if (updateError) throw updateError;
    
    // Use the PlanStatusService to update the plan status
    if (payment.plan_id) {
      await PlanStatusService.handlePaymentStatusChange(paymentId, payment.plan_id, newStatus);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error };
  }
};
