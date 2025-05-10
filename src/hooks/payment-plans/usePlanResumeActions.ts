
import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from 'sonner';

export const usePlanResumeActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void,
  refreshPlans?: () => Promise<void>
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
      const { count: paidCount, error: paidCountError } = await supabase
        .from('payment_schedule')
        .select('id', { count: 'exact', head: false })
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
      const hasPaid = !paidCountError && paidCount && paidCount > 0;
      
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
        paidCount: paidCount || 0
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
      console.log(`Resuming plan ${selectedPlan.id} with date:`, resumeDate.toISOString());
      
      // First update all paused payments to pending to prepare for rescheduling
      const { error: statusUpdateError } = await supabase
        .from('payment_schedule')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('plan_id', selectedPlan.id)
        .eq('status', 'paused');
        
      if (statusUpdateError) {
        throw new Error(`Error updating payment status: ${statusUpdateError.message}`);
      }
      
      console.log('Successfully updated all paused payments to pending status');
      
      // Now call the service to complete the resume operation
      const success = await PlanOperationsService.resumePlan(selectedPlan, resumeDate);
      
      if (success) {
        console.log('Plan resumed successfully');
        toast.success('Payment plan resumed successfully');
        
        // Close the dialogs
        setShowResumeDialog(false);
        setShowPlanDetails(false); 
        
        // Refresh the plans list if a refresh function is provided
        if (refreshPlans) {
          await refreshPlans();
        }
      } else {
        console.error('Resume plan operation returned false');
        toast.error('Failed to resume payment plan');
        setResumeError('Operation failed. Please check the console for more details.');
      }
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
