
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

  const handleOpenRescheduleDialog = async () => {
    if (selectedPlan) {
      // Check if the plan has any payments in 'sent' status
      const { data: sentPayments, error } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'sent');
      
      // Set state based on whether there are sent payments
      const hasSent = sentPayments && sentPayments.length > 0;
      setHasSentPayments(hasSent);
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
    hasSentPayments
  };
};
