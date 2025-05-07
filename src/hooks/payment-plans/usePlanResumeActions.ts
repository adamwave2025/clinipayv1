
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';

export const usePlanResumeActions = (
  selectedPlan: Plan | null,
  handleResumePlan: (planId: string, resumeDate: Date) => Promise<any>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasSentPayments, setHasSentPayments] = useState(false);

  const handleOpenResumeDialog = async () => {
    if (selectedPlan) {
      // Check if there are any paused payments that were previously sent
      const { data: sentPayments } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused')
        .not('payment_request_id', 'is', null);
      
      setHasSentPayments(sentPayments && sentPayments.length > 0);
    }
    
    setShowResumeDialog(true);
  };

  const handleConfirmResumePlan = async (resumeDate: Date) => {
    if (!selectedPlan) return;
    
    const result = await handleResumePlan(selectedPlan.id, resumeDate);
    
    if (result.success) {
      setShowResumeDialog(false);
      setShowPlanDetails(false); // Close the plan details modal
    }
  };

  return {
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan: handleConfirmResumePlan,
    handleOpenResumeDialog,
    hasSentPayments
  };
};
