import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CompleteResumePlanResponse } from '@/types/supabaseRpcTypes';
import { format } from 'date-fns';

export const usePlanResumeActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void,
  refreshPlanState?: (planId: string) => Promise<void>
) => {
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasSentPayments, setHasSentPayments] = useState(false);
  const [hasOverduePayments, setHasOverduePayments] = useState(false);
  const [hasPaidPayments, setHasPaidPayments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const handleOpenResumeDialog = async () => {
    if (!selectedPlan) {
      toast.error('No plan selected');
      return;
    }
    
    setIsProcessing(true);
    setResumeError(null);
    
    try {
      console.log('Preparing to resume plan:', selectedPlan.id);
      
      // Check if there are any paused payments
      const { data: pausedPayments, error: pausedError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused');
      
      if (pausedError) {
        throw new Error(`Error checking paused payments: ${pausedError.message}`);
      }
      
      if (!pausedPayments || pausedPayments.length === 0) {
        console.warn('No paused payments found for this plan');
        toast.error('No paused payments found to resume');
        setIsProcessing(false);
        return;
      }
      
      console.log(`Found ${pausedPayments.length} paused payments to resume`);
      
      // Check if any paused payments were previously sent
      const { data: sentPayments } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused')
        .not('payment_request_id', 'is', null);
      
      // Check if any payments have been made for this plan
      const { data: paidPayments, error: paidError } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paid');
      
      // Check for potential overdue payments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: potentialOverduePayments } = await supabase
        .from('payment_schedule')
        .select('id, due_date')
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused')
        .lt('due_date', todayStr);
      
      const hasSent = sentPayments && sentPayments.length > 0;
      const hasOverdue = potentialOverduePayments && potentialOverduePayments.length > 0;
      const hasPaid = paidPayments && paidPayments.length > 0;
      
      setHasSentPayments(hasSent);
      setHasOverduePayments(hasOverdue);
      setHasPaidPayments(hasPaid);
      
      console.log({
        planId: selectedPlan.id,
        pausedPayments: pausedPayments.length,
        hasSentPayments: hasSent,
        sentPaymentsCount: sentPayments?.length || 0,
        hasOverduePayments: hasOverdue,
        overduePaymentsCount: potentialOverduePayments?.length || 0,
        hasPaidPayments: hasPaid,
        paidCount: paidPayments?.length || 0
      });
      
      // Now open the dialog
      setShowResumeDialog(true);
      
    } catch (error) {
      console.error('Error preparing resume dialog:', error);
      setResumeError(error instanceof Error ? error.message : String(error));
      toast.error('Error preparing to resume plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumePlan = async (resumeDate: Date): Promise<void> => {
    if (!selectedPlan) {
      toast.error('No plan selected');
      return;
    }
    
    setIsProcessing(true);
    setResumeError(null);
    
    try {
      console.log(`Resuming plan ${selectedPlan.id} with date:`, resumeDate);

      // Add validation check for date in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (resumeDate < today) {
        throw new Error('Resume date cannot be in the past');
      }
      
      // Use date-fns format to ensure the correct date is preserved, regardless of timezone
      const formattedDate = format(resumeDate, 'yyyy-MM-dd');
      console.log('Formatted date for database:', formattedDate);
      
      // Call our new complete_resume_plan database function
      const { data, error } = await supabase.rpc('complete_resume_plan', {
        p_plan_id: selectedPlan.id,
        p_resume_date: formattedDate
      });
      
      console.log('Complete resume plan result:', data);
      
      if (error) {
        throw new Error(`Database function error: ${error.message}`);
      }
      
      // First convert data to unknown, then to our expected type to avoid type errors
      const result = data as unknown as CompleteResumePlanResponse;
      
      if (!result || !result.success) {
        const errorMessage = result?.error || 'Unknown error resuming plan';
        throw new Error(errorMessage);
      }
      
      // Successfully resumed the plan
      toast.success('Payment plan resumed successfully');
      
      // Close the dialog
      setShowResumeDialog(false);
      
      // Refresh the plan data using the refreshPlanState function
      if (refreshPlanState) {
        await refreshPlanState(selectedPlan.id);
      }
      
      // Keep the plan details modal open
      // setShowPlanDetails(false);
    } catch (error) {
      console.error('Error resuming plan:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to resume plan: ${errorMessage}`);
      setResumeError(errorMessage);
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
    isProcessing,
    resumeError
  };
};
