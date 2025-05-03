
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  cancelPaymentPlan, 
  pausePaymentPlan, 
  resumePaymentPlan 
} from '@/services/PaymentScheduleService';
import { Plan } from '@/utils/paymentPlanUtils';

// Update the type definition of refreshPlans to accept a Promise<Plan[]> return type
export const usePlanActions = (refreshPlans: () => Promise<Plan[]>) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendReminder = async (installmentId: string) => {
    // Implementation for sending payment reminder
    toast.info('Reminder functionality will be implemented soon');
  };

  const handleCancelPlan = async (patientId: string, paymentLinkId: string) => {
    try {
      setIsProcessing(true);
      const result = await cancelPaymentPlan(patientId, paymentLinkId);
      
      if (result.success) {
        toast.success('Payment plan cancelled successfully');
        await refreshPlans();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in handleCancelPlan:', error);
      toast.error('Failed to cancel payment plan');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePausePlan = async (patientId: string, paymentLinkId: string) => {
    try {
      setIsProcessing(true);
      const result = await pausePaymentPlan(patientId, paymentLinkId);
      
      if (result.success) {
        toast.success('Payment plan paused successfully');
        await refreshPlans();
        return true;
      }
      toast.error('Failed to pause payment plan');
      return false;
    } catch (error) {
      console.error('Error in handlePausePlan:', error);
      toast.error('Failed to pause payment plan');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumePlan = async (patientId: string, paymentLinkId: string, resumeDate: Date) => {
    try {
      setIsProcessing(true);
      const result = await resumePaymentPlan(patientId, paymentLinkId, resumeDate);
      
      if (result.success) {
        toast.success('Payment plan resumed successfully');
        await refreshPlans();
        return true;
      }
      toast.error('Failed to resume payment plan');
      return false;
    } catch (error) {
      console.error('Error in handleResumePlan:', error);
      toast.error('Failed to resume payment plan');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    showCancelDialog,
    setShowCancelDialog,
    showPauseDialog,
    setShowPauseDialog,
    showResumeDialog,
    setShowResumeDialog,
    isProcessing,
    handleSendReminder,
    handleCancelPlan,
    handlePausePlan,
    handleResumePlan
  };
};
