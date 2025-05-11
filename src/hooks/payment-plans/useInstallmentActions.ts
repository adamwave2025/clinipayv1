
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PlanPaymentService } from '@/services/plan-operations/PlanPaymentService';

export const useInstallmentActions = (
  planId: string,
  onRefresh: () => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);

  const handleMarkAsPaid = async (installmentId: string) => {
    setIsProcessing(true);
    try {
      // Use the PlanPaymentService to record a manual payment
      // Pass proper arguments (installmentId, undefined for default amount, undefined for default date)
      const result = await PlanPaymentService.recordManualPayment(installmentId, undefined, undefined);
      
      if (result.success) {
        toast.success('Payment marked as paid successfully');
        await onRefresh();
      } else {
        toast.error(`Failed to mark payment as paid: ${result.error}`);
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('Failed to mark payment as paid');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReschedule = (installmentId: string) => {
    setSelectedInstallmentId(installmentId);
    setShowRescheduleDialog(true);
  };

  const handleReschedulePayment = async (newDate: Date) => {
    if (!selectedInstallmentId) {
      toast.error('No installment selected for rescheduling');
      return;
    }

    setIsProcessing(true);
    try {
      // Use the PlanPaymentService.reschedulePayment function
      const result = await PlanPaymentService.reschedulePayment(selectedInstallmentId, newDate);
      
      if (result.success) {
        toast.success('Payment rescheduled successfully');
        await onRefresh();
      } else {
        toast.error(`Failed to reschedule payment: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rescheduling payment:', error);
      toast.error('Failed to reschedule payment');
    } finally {
      setIsProcessing(false);
      setShowRescheduleDialog(false);
      setSelectedInstallmentId(null);
    }
  };

  // Function to handle taking a payment directly
  const handleTakePayment = async (installmentId: string) => {
    // This would typically open a payment form or redirect to a payment page
    // For now, we'll just log it
    console.log(`Taking payment for installment ${installmentId}`);
    toast.info('Taking payment - feature under development');
  };

  return {
    isProcessing,
    showRescheduleDialog,
    setShowRescheduleDialog,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment,
    handleTakePayment,
    selectedInstallmentId
  };
};
