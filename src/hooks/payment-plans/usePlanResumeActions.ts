
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { PlanStatusService } from '@/services/PlanStatusService';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from 'sonner';

export const usePlanResumeActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void
) => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasSentPayments, setHasSentPayments] = useState(false);
  const [hasOverduePayments, setHasOverduePayments] = useState(false);
  const [hasPaidPayments, setHasPaidPayments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenResumeDialog = async () => {
    if (selectedPlan) {
      setIsProcessing(true);
      
      try {
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
      } catch (error) {
        console.error('Error preparing resume dialog:', error);
      } finally {
        setIsProcessing(false);
        setShowResumeDialog(true);
      }
    } else {
      setShowResumeDialog(true);
    }
  };

  const handleResumePlan = async (resumeDate: Date): Promise<void> => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // Ensure the date is normalized to midnight to avoid timezone issues
      const normalizedDate = new Date(resumeDate);
      normalizedDate.setHours(0, 0, 0, 0);
      
      console.log('Confirming resume with date:', normalizedDate.toISOString());
      
      // Use PlanOperationsService directly
      const success = await PlanOperationsService.resumePlan(selectedPlan, normalizedDate);
      
      if (success) {
        toast.success('Payment plan resumed successfully');
        setShowResumeDialog(false);
        setShowPlanDetails(false); // Close the plan details modal
      } else {
        toast.error('Failed to resume payment plan');
      }
    } catch (error) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume payment plan');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    showResumeDialog,
    setShowResumeDialog,
    handleResumePlan,
    handleOpenResumeDialog,
    hasSentPayments,
    hasOverduePayments,
    hasPaidPayments,
    isProcessing
  };
};
