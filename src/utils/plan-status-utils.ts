
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
