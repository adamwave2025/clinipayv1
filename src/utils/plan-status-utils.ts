
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Force a manual update of plan statuses by calling the update-plan-statuses edge function
 * This is useful for testing or immediate updates when needed
 */
export async function updatePlanStatuses() {
  try {
    console.log('Manually triggering plan status update...');
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('update-plan-statuses');
    
    if (error) {
      console.error('Error updating plan statuses:', error);
      toast.error('Failed to update plan statuses: ' + error.message);
      return { success: false, error };
    }
    
    console.log('Plan status update result:', data);
    
    if (data.plans_updated > 0) {
      toast.success(`Updated ${data.plans_updated} plans with overdue status`);
    } else {
      toast.info('No plans needed status updates');
    }
    
    return { success: true, data };
  } catch (err: any) {
    console.error('Exception updating plan statuses:', err);
    toast.error('Failed to update plan statuses: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Manually trigger a refresh of the user interface after updating a plan status
 * This can be used after making manual status changes to force the UI to update
 */
export async function refreshPlanDisplay() {
  try {
    // Simple toast notification that we're refreshing the display
    toast.info('Refreshing payment plan information...');
    
    // We could add additional logic here if needed
    // For now we just notify the user as most components will refresh on their own
    
    return { success: true };
  } catch (err: any) {
    console.error('Exception refreshing plan display:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if a payment plan is currently overdue and update its status if needed
 * @param planId The ID of the plan to check
 */
export async function checkAndUpdatePlanOverdueStatus(planId: string) {
  try {
    console.log(`Checking overdue status for plan ${planId}...`);
    
    // Fetch the current plan data
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) {
      console.error('Error fetching plan data:', planError);
      return { success: false, error: planError };
    }
    
    // Fetch all schedule entries for this plan
    const { data: scheduleEntries, error: entriesError } = await supabase
      .from('payment_schedule')
      .select('*')
      .eq('plan_id', planId)
      .order('due_date', { ascending: true });
      
    if (entriesError) {
      console.error('Error fetching schedule entries:', entriesError);
      return { success: false, error: entriesError };
    }
    
    // Check if any entries are overdue
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of day for accurate comparison
    
    const hasOverduePayments = scheduleEntries.some(entry => {
      const dueDate = new Date(entry.due_date);
      dueDate.setHours(0, 0, 0, 0); // Start of day for accurate comparison
      return entry.status !== 'paid' && entry.status !== 'cancelled' && dueDate < now;
    });
    
    // If the overdue status has changed, update the plan
    if (hasOverduePayments !== plan.has_overdue_payments || 
       (hasOverduePayments && plan.status !== 'overdue' && 
        plan.status !== 'paused' && plan.status !== 'cancelled')) {
      
      // Determine the new status
      let newStatus = plan.status;
      if (hasOverduePayments && plan.status !== 'paused' && plan.status !== 'cancelled') {
        newStatus = 'overdue';
      } else if (!hasOverduePayments && plan.status === 'overdue') {
        newStatus = 'active';
      }
      
      // Update the plan
      const { error: updateError } = await supabase
        .from('plans')
        .update({
          has_overdue_payments: hasOverduePayments,
          status: newStatus
        })
        .eq('id', planId);
        
      if (updateError) {
        console.error('Error updating plan status:', updateError);
        return { success: false, error: updateError };
      }
      
      // If the plan is becoming overdue, we should log an 'overdue' activity
      if (newStatus === 'overdue' && plan.status !== 'overdue') {
        // Get overdue payments for the activity log
        const overdueEntries = scheduleEntries.filter(entry => {
          const dueDate = new Date(entry.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return entry.status !== 'paid' && entry.status !== 'cancelled' && dueDate < now;
        });
        
        const { error: activityError } = await supabase
          .from('payment_plan_activities')
          .insert({
            patient_id: plan.patient_id,
            payment_link_id: plan.payment_link_id,
            clinic_id: plan.clinic_id,
            action_type: 'overdue',
            details: {
              previous_status: plan.status,
              overdue_count: overdueEntries.length,
              overdue_items: overdueEntries.map(p => ({
                id: p.id,
                payment_number: p.payment_number,
                due_date: p.due_date
              }))
            }
          });
          
        if (activityError) {
          console.error('Error logging overdue activity:', activityError);
        }
      }
      
      // No activity needed when returning to active state - we just silently update the status
      
      console.log(`Updated plan status from ${plan.status} to ${newStatus}`);
      return { 
        success: true, 
        updated: true,
        oldStatus: plan.status,
        newStatus,
        hasOverduePayments
      };
    }
    
    return { success: true, updated: false };
  } catch (err: any) {
    console.error('Exception checking plan overdue status:', err);
    return { success: false, error: err.message };
  }
}
