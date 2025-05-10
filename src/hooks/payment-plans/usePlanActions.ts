
import { useState } from 'react';
import { 
  recordPaymentRefund
} from '@/services/PaymentScheduleService';
import { sendPaymentReminder } from '@/services/PaymentReminderService';
import { toast } from 'sonner';
import { Plan } from '@/utils/planTypes';
import { PlanStatusService } from '@/services/PlanStatusService';
import { PlanOperationsService } from '@/services/PlanOperationsService';

/**
 * Hook for managing payment plan actions like pause, resume, cancel, etc.
 * @deprecated This hook is being consolidated with useSharedPlanManagement to avoid duplication
 */
export const usePlanActions = (refreshPlans: () => Promise<Plan[]>) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Send a payment reminder for an installment
   */
  const handleSendReminder = async (installmentId: string): Promise<void> => {
    try {
      setIsProcessing(true);
      // Use PlanOperationsService for consistent API
      const result = await PlanOperationsService.sendPaymentReminder(installmentId);
      
      // Already displaying toast in the service
      return;
    } catch (error) {
      toast.error('Failed to send payment reminder');
      return;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Cancel a payment plan
   */
  const handleCancelPlan = async (planId: string) => {
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await getPlanDetailsForService(planId);
      if (!plan) {
        toast.error('Failed to get plan details');
        return { success: false, error: 'Plan not found' };
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.cancelPlan(plan);
      
      if (success) {
        toast.success('Payment plan cancelled successfully');
        await refreshPlans();
        return { success: true };
      } else {
        toast.error('Failed to cancel payment plan');
        return { success: false };
      }
    } catch (error) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Pause a payment plan
   */
  const handlePausePlan = async (planId: string) => {
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await getPlanDetailsForService(planId);
      if (!plan) {
        toast.error('Failed to get plan details');
        return { success: false, error: 'Plan not found' };
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.pausePlan(plan);
      
      if (success) {
        toast.success('Payment plan paused successfully');
        await refreshPlans();
        return { success: true };
      } else {
        toast.error('Failed to pause payment plan');
        return { success: false };
      }
    } catch (error) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Resume a paused payment plan
   */
  const handleResumePlan = async (planId: string, resumeDate: Date) => {
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await getPlanDetailsForService(planId);
      if (!plan) {
        toast.error('Failed to get plan details');
        return { success: false, error: 'Plan not found' };
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.resumePlan(plan, resumeDate);
      
      if (success) {
        toast.success('Payment plan resumed successfully');
        await refreshPlans();
        return { success: true };
      } else {
        toast.error('Failed to resume payment plan');
        return { success: false };
      }
    } catch (error) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Reschedule a payment plan with new start date
   */
  const handleReschedulePlan = async (planId: string, newStartDate: Date) => {
    try {
      setIsProcessing(true);
      
      // Get the plan details first to provide to PlanOperationsService
      const plan = await getPlanDetailsForService(planId);
      if (!plan) {
        toast.error('Failed to get plan details');
        return { success: false, error: 'Plan not found' };
      }
      
      // Use PlanOperationsService for consistent API
      const success = await PlanOperationsService.reschedulePlan(plan, newStartDate);
      
      if (success) {
        toast.success('Payment plan rescheduled successfully');
        await refreshPlans();
        return { success: true };
      } else {
        toast.error('Failed to reschedule payment plan');
        return { success: false };
      }
    } catch (error) {
      console.error('Error rescheduling plan:', error);
      toast.error('Failed to reschedule payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Record a refund for a payment
   */
  const handleRecordRefund = async (paymentId: string, amount: number, isFullRefund: boolean) => {
    try {
      setIsProcessing(true);
      // Use PlanOperationsService for consistent API
      const result = await PlanOperationsService.recordPaymentRefund(paymentId, amount, isFullRefund);
      
      if (result.success) {
        toast.success(`Payment ${isFullRefund ? 'fully' : 'partially'} refunded`);
        await refreshPlans();
      } else {
        toast.error('Failed to record refund');
      }
      
      return result;
    } catch (error) {
      console.error('Error recording refund:', error);
      toast.error('Failed to record refund');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Helper function to get plan details for use with service methods
   * @private
   */
  const getPlanDetailsForService = async (planId: string): Promise<Plan | null> => {
    try {
      const response = await fetch(`/api/plans/${planId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch plan: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching plan details:', error);
      
      // Fallback to fetch directly from Supabase if API call fails
      try {
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single();
          
        if (planError) throw planError;
        
        // Format the plan data to match expected Plan interface
        return formatPlanFromDb(planData);
      } catch (err) {
        console.error('Fallback plan fetch also failed:', err);
        return null;
      }
    }
  };

  return {
    isProcessing,
    handleSendReminder,
    handleCancelPlan,
    handlePausePlan,
    handleResumePlan,
    handleReschedulePlan,
    handleRecordRefund
  };
};

// Import at the end to avoid circular dependencies
import { supabase } from '@/integrations/supabase/client';
import { formatPlanFromDb } from '@/utils/planTypes';
