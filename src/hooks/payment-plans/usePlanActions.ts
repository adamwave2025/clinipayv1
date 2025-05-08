import { useState } from 'react';
import { 
  cancelPaymentPlan, 
  pausePaymentPlan,
  resumePaymentPlan,
  reschedulePaymentPlan,
  recordPaymentRefund
} from '@/services/PaymentScheduleService';
import { sendPaymentReminder } from '@/services/PaymentReminderService';
import { toast } from 'sonner';
import { Plan } from '@/utils/planTypes';
import { PlanStatusService } from '@/services/PlanStatusService';

export const usePlanActions = (refreshPlans: () => Promise<Plan[]>) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendReminder = async (installmentId: string): Promise<void> => {
    try {
      setIsProcessing(true);
      const result = await sendPaymentReminder(installmentId);
      
      // Already displaying toast in the service
      return;
    } catch (error) {
      toast.error('Failed to send payment reminder');
      return;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPlan = async (planId: string) => {
    try {
      setIsProcessing(true);
      const result = await cancelPaymentPlan(planId);
      
      if (result.success) {
        toast.success('Payment plan cancelled successfully');
        await refreshPlans();
      } else {
        toast.error('Failed to cancel payment plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error cancelling plan:', error);
      toast.error('Failed to cancel payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePausePlan = async (planId: string) => {
    try {
      setIsProcessing(true);
      const result = await pausePaymentPlan(planId);
      
      if (result.success) {
        toast.success('Payment plan paused successfully');
        await refreshPlans();
      } else {
        toast.error('Failed to pause payment plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error pausing plan:', error);
      toast.error('Failed to pause payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleResumePlan = async (planId: string, resumeDate: Date) => {
    try {
      setIsProcessing(true);
      const result = await resumePaymentPlan(planId, resumeDate);
      
      if (result.success) {
        toast.success('Payment plan resumed successfully');
        await refreshPlans();
      } else {
        toast.error('Failed to resume payment plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error resuming plan:', error);
      toast.error('Failed to resume payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReschedulePlan = async (planId: string, newStartDate: Date) => {
    try {
      setIsProcessing(true);
      const result = await reschedulePaymentPlan(planId, newStartDate);
      
      if (result.success) {
        toast.success('Payment plan rescheduled successfully');
        await refreshPlans();
      } else {
        toast.error('Failed to reschedule payment plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error rescheduling plan:', error);
      toast.error('Failed to reschedule payment plan');
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRecordRefund = async (paymentId: string, amount: number, isFullRefund: boolean) => {
    try {
      setIsProcessing(true);
      const result = await recordPaymentRefund(paymentId, amount, isFullRefund);
      
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
