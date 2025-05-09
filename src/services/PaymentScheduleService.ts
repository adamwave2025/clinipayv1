
import { supabase } from '@/integrations/supabase/client';
import { Plan, formatPlanFromDb } from '@/utils/planTypes';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Fetch plans directly from the plans table
 */
export const fetchPlans = async (userId: string): Promise<Plan[]> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw userError;
    }

    const clinicId = userData.clinic_id;
    
    const { data, error } = await supabase
      .from('plans')
      .select(`
        *,
        patients (
          id, name, email
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log('Raw plans data from DB:', data);
    
    // Format the plans using the helper function
    const formattedPlans = data.map(plan => {
      const formatted = formatPlanFromDb(plan);
      // Ensure patientName is set correctly
      if (!formatted.patientName && formatted.patients?.name) {
        formatted.patientName = formatted.patients.name;
      }
      return formatted;
    });
    
    console.log('Formatted plans:', formattedPlans);
    
    return formattedPlans;
  } catch (error) {
    console.error('Error fetching plans:', error);
    toast.error('Failed to load payment plans');
    return [];
  }
};

export const fetchPlanInstallments = async (planId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_schedule')
      .select(`
        id, 
        payment_number,
        total_payments,
        due_date,
        amount,
        status,
        payment_request_id,
        plan_id,
        payment_requests (
          id, status, payment_id, paid_at
        )
      `)
      .eq('plan_id', planId)
      .order('payment_number', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching plan installments:', error);
    toast.error('Failed to load payment installments');
    return [];
  }
};

export const fetchPlanActivities = async (planId: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_activity')
      .select('*')
      .eq('plan_id', planId)
      .order('performed_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching plan activities:', error);
    toast.error('Failed to load plan activities');
    return [];
  }
};

/**
 * Record activity for a payment plan
 */
export const recordPaymentPlanActivity = async (params: {
  planId: string;
  actionType: string;
  details?: any;
}) => {
  try {
    // Get plan details to populate related fields
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('clinic_id, patient_id, payment_link_id')
      .eq('id', params.planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan data for activity record:', planError);
      throw planError;
    }
    
    const performedByUserId = (await supabase.auth.getUser()).data.user?.id;
    
    const activityData = {
      plan_id: params.planId,
      clinic_id: planData.clinic_id,
      patient_id: planData.patient_id,
      payment_link_id: planData.payment_link_id,
      action_type: params.actionType,
      details: params.details || {},
      performed_at: new Date().toISOString(),
      performed_by_user_id: performedByUserId
    };
    
    const { error } = await supabase
      .from('payment_activity')
      .insert(activityData);
      
    if (error) {
      console.error('Error recording plan activity:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to record payment plan activity:', error);
    return { success: false, error };
  }
};

/**
 * Cancel a payment plan
 */
export const cancelPaymentPlan = async (planId: string) => {
  try {
    // Update the plan status
    const { error: updatePlanError } = await supabase
      .from('plans')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (updatePlanError) {
      throw updatePlanError;
    }
    
    // Update all pending/upcoming payments to cancelled
    const { error: updateScheduleError } = await supabase
      .from('payment_schedule')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('plan_id', planId)
      .in('status', ['pending', 'scheduled']);
      
    if (updateScheduleError) {
      throw updateScheduleError;
    }
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_cancelled',
      details: {
        cancelled_at: new Date().toISOString()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Pause a payment plan
 */
export const pausePaymentPlan = async (planId: string) => {
  try {
    // Update the plan status
    const { error: updatePlanError } = await supabase
      .from('plans')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (updatePlanError) {
      throw updatePlanError;
    }
    
    // We don't change the payment_schedule statuses when pausing,
    // just mark the plan as paused to prevent sending new payments
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_paused',
      details: {
        paused_at: new Date().toISOString()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error pausing payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Resume a paused payment plan
 */
export const resumePaymentPlan = async (planId: string, resumeDate: Date) => {
  try {
    // Get all pending payment_schedule entries for this plan
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select('*')
      .eq('plan_id', planId)
      .in('status', ['pending', 'scheduled'])
      .order('payment_number', { ascending: true });
      
    if (scheduleError) {
      throw scheduleError;
    }
    
    if (!scheduleData || scheduleData.length === 0) {
      throw new Error('No pending payments found for this plan');
    }
    
    // Find the next payment due date
    const firstPendingPayment = scheduleData[0];
    const formattedResumeDate = format(resumeDate, 'yyyy-MM-dd');
    
    // Update the plan status
    const { error: updatePlanError } = await supabase
      .from('plans')
      .update({
        status: 'active',
        next_due_date: formattedResumeDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (updatePlanError) {
      throw updatePlanError;
    }
    
    // Update the next payment due date
    const { error: updateScheduleError } = await supabase
      .from('payment_schedule')
      .update({
        due_date: formattedResumeDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', firstPendingPayment.id);
      
    if (updateScheduleError) {
      throw updateScheduleError;
    }
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_resumed',
      details: {
        resumed_at: new Date().toISOString(),
        next_payment_date: formattedResumeDate
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error resuming payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Reschedule all remaining payments in a plan
 */
export const reschedulePaymentPlan = async (planId: string, newStartDate: Date) => {
  try {
    // Get the plan details
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) {
      throw planError;
    }
    
    // Get all pending payment_schedule entries for this plan
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('payment_schedule')
      .select('*')
      .eq('plan_id', planId)
      .in('status', ['pending', 'scheduled'])
      .order('payment_number', { ascending: true });
      
    if (scheduleError) {
      throw scheduleError;
    }
    
    if (!scheduleData || scheduleData.length === 0) {
      throw new Error('No pending payments found to reschedule');
    }
    
    const originalDates = scheduleData.map(s => s.due_date);
    
    // Calculate new dates based on payment frequency and new start date
    const newDates = calculateNewPaymentDates(
      newStartDate, 
      planData.payment_frequency, 
      scheduleData.length
    );
    
    // Update each payment schedule entry with its new date
    const updates = scheduleData.map((payment, index) => {
      return supabase
        .from('payment_schedule')
        .update({
          due_date: newDates[index],
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
    });
    
    // Run all updates in parallel
    await Promise.all(updates.map(query => query));
    
    // Update the plan's next due date
    const { error: updatePlanError } = await supabase
      .from('plans')
      .update({
        next_due_date: newDates[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
    
    if (updatePlanError) {
      throw updatePlanError;
    }
    
    // Record the activity
    await recordPaymentPlanActivity({
      planId,
      actionType: 'plan_rescheduled',
      details: {
        rescheduled_at: new Date().toISOString(),
        original_next_date: originalDates[0],
        new_next_date: newDates[0],
        affected_payments: scheduleData.length
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rescheduling payment plan:', error);
    return { success: false, error };
  }
};

/**
 * Record a refund for a payment
 */
export const recordPaymentRefund = async (paymentId: string, amount: number, isFullRefund: boolean) => {
  try {
    // Get the payment details
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('payment_link_id')
      .eq('id', paymentId)
      .single();
      
    if (paymentError) {
      throw paymentError;
    }
    
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
};

/**
 * Helper function to calculate new payment dates based on frequency
 */
const calculateNewPaymentDates = (startDate: Date, frequency: string, count: number): string[] => {
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
};
