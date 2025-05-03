
import { useState } from 'react';
import { toast } from 'sonner';
import { cancelPaymentPlan } from '@/services/PaymentScheduleService';
import { Plan } from '@/utils/paymentPlanUtils';

// Update the type definition of refreshPlans to accept a Promise<Plan[]> return type
export const usePlanActions = (refreshPlans: () => Promise<Plan[]>) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleSendReminder = async (installmentId: string) => {
    // Implementation for sending payment reminder
    toast.info('Reminder functionality will be implemented soon');
  };

  const handleCancelPlan = async (patientId: string, paymentLinkId: string) => {
    try {
      const result = await cancelPaymentPlan(patientId, paymentLinkId);
      
      if (result.success) {
        toast.success('Payment plan cancelled successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error in handleCancelPlan:', error);
      toast.error('Failed to cancel payment plan');
      return false;
    }
  };

  const handlePausePlan = () => {
    toast.info('Pause plan functionality will be implemented soon');
    // We'll implement the actual functionality in the future
  };

  return {
    showCancelDialog,
    setShowCancelDialog,
    handleSendReminder,
    handleCancelPlan,
    handlePausePlan
  };
};
