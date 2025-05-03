
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
  try {
    const { data, error } = await supabase
      .from('payment_schedule')
      .select(`
        id,
        patient_id,
        payment_link_id,
        amount,
        due_date,
        payment_number,
        total_payments,
        status,
        payment_request_id,
        payment_requests (
          id,
          status,
          payment_id
        ),
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
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payment schedules:', error);
    toast.error('Failed to load payment plans');
    return [];
  }
};

export const fetchPlanInstallments = async (patientId: string, paymentLinkId: string) => {
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
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .order('payment_number', { ascending: true });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching plan installments:', error);
    toast.error('Failed to load payment details');
    return [];
  }
};

export const fetchPlanActivities = async (patientId: string, paymentLinkId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_plan_activities')
      .select('*')
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .order('performed_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching plan activities:', error);
    return [];
  }
};

export const recordPaymentPlanActivity = async (
  patientId: string,
  paymentLinkId: string,
  clinicId: string,
  actionType: PlanActivityType,
  details: any,
  userId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('payment_plan_activities')
      .insert({
        patient_id: patientId,
        payment_link_id: paymentLinkId,
        clinic_id: clinicId,
        action_type: actionType,
        performed_by_user_id: userId,
        details: details
      })
      .select();
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error recording payment plan activity:', error);
    return { success: false, error };
  }
};

export const cancelPaymentPlan = async (patientId: string, paymentLinkId: string, userId?: string) => {
  try {
    // Get clinic_id for the activity record
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select('clinic_id')
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .limit(1)
      .single();
      
    if (scheduleError) throw scheduleError;
    
    // Update all pending installments for this plan to 'cancelled'
    const { data, error } = await supabase
      .from('payment_schedule')
      .update({ status: 'cancelled' })
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .in('status', ['pending', 'upcoming', 'paused', 'sent', 'processed'])
      .select();

    if (error) throw error;
    
    // Record the activity
    await recordPaymentPlanActivity(
      patientId,
      paymentLinkId,
      scheduleData.clinic_id,
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

export const pausePaymentPlan = async (patientId: string, paymentLinkId: string, userId?: string) => {
  try {
    // Get clinic_id for the activity record
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select('clinic_id')
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .limit(1)
      .single();
      
    if (scheduleError) throw scheduleError;
    
    // Update all pending/upcoming installments for this plan to 'paused'
    const { data, error } = await supabase
      .from('payment_schedule')
      .update({ status: 'paused' })
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .in('status', ['pending', 'upcoming', 'sent', 'processed'])
      .select();

    if (error) throw error;
    
    // Record the activity
    await recordPaymentPlanActivity(
      patientId,
      paymentLinkId,
      scheduleData.clinic_id,
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

export const resumePaymentPlan = async (patientId: string, paymentLinkId: string, resumeDate: Date, userId?: string) => {
  try {
    console.log('Original resumeDate received:', resumeDate);
    
    // Get clinic_id and other data for the activity record
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select('clinic_id, payment_frequency')
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .limit(1)
      .single();
      
    if (scheduleError) throw scheduleError;
    
    // First get all paused installments for this plan
    const { data: pausedInstallments, error: fetchError } = await supabase
      .from('payment_schedule')
      .select('id, payment_number, payment_frequency')
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .eq('status', 'paused')
      .order('payment_number', { ascending: true });
    
    if (fetchError) throw fetchError;
    
    if (!pausedInstallments || pausedInstallments.length === 0) {
      return { success: true, message: 'No paused installments found' };
    }
    
    // Keep track of original and new due dates for audit
    const dueChanges = [];
    
    // Calculate new due dates for each installment
    const frequency = scheduleData.payment_frequency || 'monthly';
    const updatePromises = pausedInstallments.map((installment, index) => {
      // Calculate new due date based on the resume date and installment index
      const newDueDate = calculateNewDueDate(resumeDate, index, frequency);
      
      // Format date using YYYY-MM-DD format to avoid timezone issues
      const formattedDate = formatDateToYYYYMMDD(newDueDate);
      
      // Track changes for audit
      dueChanges.push({
        installment_id: installment.id,
        payment_number: installment.payment_number,
        new_due_date: formattedDate
      });
      
      console.log(`Installment ${installment.payment_number}, new due date: ${formattedDate}`);
      
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
    
    // Record the activity
    await recordPaymentPlanActivity(
      patientId,
      paymentLinkId,
      scheduleData.clinic_id,
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
  patientId: string, 
  paymentLinkId: string, 
  newStartDate: Date,
  userId?: string
) => {
  try {
    console.log('Original newStartDate received:', newStartDate);
    
    // Get clinic_id and other data for the activity record
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select('clinic_id, payment_frequency')
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .limit(1)
      .single();
      
    if (scheduleError) throw scheduleError;
    
    // First get all pending/upcoming/sent/processed installments for this plan
    const { data: pendingInstallments, error: fetchError } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        payment_number, 
        payment_frequency,
        due_date,
        status,
        payment_request_id,
        amount
      `)
      .eq('patient_id', patientId)
      .eq('payment_link_id', paymentLinkId)
      .in('status', ['pending', 'upcoming', 'sent', 'processed'])
      .order('payment_number', { ascending: true });
    
    if (fetchError) throw fetchError;
    
    if (!pendingInstallments || pendingInstallments.length === 0) {
      return { success: true, message: 'No pending installments found to reschedule' };
    }
    
    // Track all changes for audit log
    const changes = {
      original_dates: {},
      new_dates: {},
      sent_payment_requests_cancelled: []
    };
    
    // First, collect all payment_request_ids that need to be cancelled
    const paymentRequestIds = pendingInstallments
      .filter(item => item.payment_request_id !== null)
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
    
    // Calculate new due dates for each installment
    const frequency = scheduleData.payment_frequency || 'monthly';
    
    // Process each installment
    const updatePromises = pendingInstallments.map(async (installment, index) => {
      // Calculate new due date based on the new start date and installment index
      const newDueDate = calculateNewDueDate(newStartDate, index, frequency);
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
    
    // Record the activity
    await recordPaymentPlanActivity(
      patientId,
      paymentLinkId,
      scheduleData.clinic_id,
      'reschedule',
      { 
        installments_affected: pendingInstallments.length,
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
