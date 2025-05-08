
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
      
      // Check if the plan had any overdue payments before being paused
      // This captures plans that were paused while having overdue status
      const wasOverdue = selectedPlan.hasOverduePayments;
      
      // Also check for payments that were explicitly marked as overdue before pausing
      const { data: overduePayments } = await supabase
        .from('payment_activity')
        .select('details')
        .eq('plan_id', selectedPlan.id)
        .eq('action_type', 'pause_plan')
        .order('performed_at', { ascending: false })
        .limit(1);
      
      // Check if the pause activity log indicates overdue payments were paused
      let hadOverduePaymentsWhenPaused = false;
      if (overduePayments && overduePayments.length > 0) {
        const details = overduePayments[0].details;
        
        // Type check the details object to ensure it's a record with overdue_count
        if (details && 
            typeof details === 'object' && 
            details !== null && 
            'overdue_count' in details &&
            typeof details.overdue_count === 'number') {
          hadOverduePaymentsWhenPaused = details.overdue_count > 0;
        }
      }
      
      setHasSentPayments(sentPayments && sentPayments.length > 0);
      setHasOverduePayments(wasOverdue || hadOverduePaymentsWhenPaused);
      setHasPaidPayments(!paidCountError && paidCount > 0);
      
      console.log({
        hasSentPayments: sentPayments && sentPayments.length > 0,
        hasOverduePayments: wasOverdue || hadOverduePaymentsWhenPaused,
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
