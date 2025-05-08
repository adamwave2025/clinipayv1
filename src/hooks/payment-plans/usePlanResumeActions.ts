
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { PlanStatusService } from '@/services/PlanStatusService';

export const usePlanResumeActions = (
  selectedPlan: Plan | null,
  handleResumePlan: (planId: string, resumeDate: Date) => Promise<any>,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasSentPayments, setHasSentPayments] = useState(false);
  const [hasOverduePayments, setHasOverduePayments] = useState(false);
  const [hasPaidPayments, setHasPaidPayments] = useState(false);

  const handleOpenResumeDialog = async () => {
    if (selectedPlan) {
      // Check if there are any paused payments that were previously sent
      const { data: sentPayments } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused')
        .not('payment_request_id', 'is', null);
      
      // Check if any payments have been made for this plan
      const { count: paidCount, error: paidCountError } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact', head: false })
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paid');
      
      // Check if there would be overdue payments when resumed
      // Get today's date for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Check for any paused payments that have due dates before today
      const { data: potentialOverduePayments } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused')
        .lt('due_date', todayStr);
      
      const wouldHaveOverduePayments = potentialOverduePayments && potentialOverduePayments.length > 0;
      
      setHasSentPayments(sentPayments && sentPayments.length > 0);
      setHasOverduePayments(wouldHaveOverduePayments);
      setHasPaidPayments(!paidCountError && paidCount > 0);
      
      console.log({
        hasSentPayments: sentPayments && sentPayments.length > 0,
        hasOverduePayments: wouldHaveOverduePayments,
        hasPaidPayments: !paidCountError && paidCount > 0,
        paidCount: paidCount
      });
    }
    
    setShowResumeDialog(true);
  };

  const handleConfirmResumePlan = async (resumeDate: Date) => {
    if (!selectedPlan) return;
    
    const result = await handleResumePlan(selectedPlan.id, resumeDate);
    
    if (result?.success) {
      setShowResumeDialog(false);
      setShowPlanDetails(false); // Close the plan details modal
    }
  };

  return {
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan: handleConfirmResumePlan,
    handleOpenResumeDialog,
    hasSentPayments,
    hasOverduePayments,
    hasPaidPayments
  };
};
