
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';

export const usePlanRescheduleActions = (
  selectedPlan: Plan | null,
  handleReschedulePlan: (planId: string, newStartDate: Date) => Promise<any>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [hasSentPayments, setHasSentPayments] = useState(false);
  const [hasOverduePayments, setHasOverduePayments] = useState(false);

  const handleOpenRescheduleDialog = async () => {
    if (selectedPlan) {
      try {
        // Check for sent payments that haven't been paid yet
        const { data: sentPayments, error: sentError } = await supabase
          .from('payment_schedule')
          .select('id')
          .eq('plan_id', selectedPlan.id)
          .eq('status', 'sent')
          .not('payment_request_id', 'is', null);
        
        if (sentError) throw sentError;
        
        // Check for overdue payments
        const { data: overduePayments, error: overdueError } = await supabase
          .from('payment_schedule')
          .select('id')
          .eq('plan_id', selectedPlan.id)
          .eq('status', 'overdue');
        
        if (overdueError) throw overdueError;
        
        // Set flags for the dialog to show appropriate notices
        setHasSentPayments(sentPayments && sentPayments.length > 0);
        setHasOverduePayments(
          (overduePayments && overduePayments.length > 0) || 
          selectedPlan.status === 'overdue'
        );
        
      } catch (error) {
        console.error('Error checking plan payment statuses:', error);
      }
    }
    
    setShowRescheduleDialog(true);
  };

  const handleConfirmReschedulePlan = async (newStartDate: Date) => {
    if (!selectedPlan) return;
    
    const result = await handleReschedulePlan(selectedPlan.id, newStartDate);
    
    if (result.success) {
      setShowRescheduleDialog(false);
      setShowPlanDetails(false); // Close the plan details modal
    }
  };

  return {
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan: handleConfirmReschedulePlan,
    handleOpenRescheduleDialog,
    hasSentPayments,
    hasOverduePayments
  };
};
