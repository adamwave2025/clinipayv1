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
