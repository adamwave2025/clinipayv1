
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
      // Check if the plan has any payments in 'sent' status
      const { data: sentPayments, error: sentError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'sent');
      
      // Check if the plan has any payments in 'overdue' status
      const { data: overduePayments, error: overdueError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'overdue');
      
      // Set state based on whether there are sent or overdue payments
      setHasSentPayments(sentPayments && sentPayments.length > 0);
      setHasOverduePayments((overduePayments && overduePayments.length > 0) || selectedPlan.status === 'overdue');
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
