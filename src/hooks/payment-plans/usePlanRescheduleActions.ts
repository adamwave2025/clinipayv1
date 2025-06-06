import { useState } from 'react';
import { Plan } from '@/utils/planTypes';
import { supabase } from '@/integrations/supabase/client';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { toast } from 'sonner';

export const usePlanRescheduleActions = (
  selectedPlan: Plan | null,
  setShowPlanDetails: (show: boolean) => void,
  refreshPlanState?: (planId: string) => Promise<void>,
  setIsTemplateView?: (isTemplate: boolean) => void // Add optional setIsTemplateView parameter
) => {
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [hasSentPayments, setHasSentPayments] = useState(false);
  const [hasOverduePayments, setHasOverduePayments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenRescheduleDialog = async () => {
    if (selectedPlan) {
      setIsProcessing(true);
      
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
      } finally {
        setIsProcessing(false);
        setShowRescheduleDialog(true);
      }
    } else {
      setShowRescheduleDialog(true);
    }
  };

  const handleReschedulePlan = async (newStartDate: Date) => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    try {
      // Use PlanOperationsService directly
      const success = await PlanOperationsService.reschedulePlan(selectedPlan, newStartDate);
      
      if (success) {
        toast.success('Payment plan rescheduled successfully');
        
        // Refresh the plan data using the refreshPlanState function
        if (refreshPlanState) {
          await refreshPlanState(selectedPlan.id);
        }
        
        // Close the dialog but keep the plan details open
        setShowRescheduleDialog(false);
        // setShowPlanDetails(false); // Keep the plan details modal open
        
        // Explicitly set view back to patient plans (not templates)
        if (setIsTemplateView) {
          console.log("Resetting view to patient plans after successful reschedule");
          setIsTemplateView(false);
        }
      } else {
        toast.error('Failed to reschedule payment plan');
      }
    } catch (error) {
      console.error('Error rescheduling plan:', error);
      toast.error('Failed to reschedule payment plan');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleReschedulePlan,
    handleOpenRescheduleDialog,
    hasSentPayments,
    hasOverduePayments,
    isProcessing
  };
};
