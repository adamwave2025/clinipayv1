
import { useState } from 'react';
import { toast } from 'sonner';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { usePaymentRescheduleActions } from './usePaymentRescheduleActions';

export const useInstallmentActions = (
  planId: string,
  onPaymentUpdated: () => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any | null>(null);
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  
  // Use the payment reschedule actions hook
  const {
    handleOpenRescheduleDialog,
    handleReschedulePayment
  } = usePaymentRescheduleActions(planId, onPaymentUpdated);

  const handleMarkAsPaid = (paymentId: string) => {
    console.log("Opening mark as paid dialog for", paymentId);
    // Find the selected installment
    setSelectedInstallment({ id: paymentId });
    setShowMarkAsPaidDialog(true);
  };
  
  const handleOpenReschedule = (paymentId: string) => {
    console.log("Opening reschedule dialog for payment", paymentId);
    handleOpenRescheduleDialog(paymentId);
  };
  
  const handleTakePayment = (paymentId: string) => {
    console.log("Take payment clicked for", paymentId);
    // This will be implemented in another task
    toast.info("Take payment functionality coming soon");
  };
  
  const confirmMarkAsPaid = async () => {
    if (!selectedInstallment) {
      toast.error('No payment selected');
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await PlanOperationsService.recordManualPayment(selectedInstallment.id);
      
      if (result.success) {
        toast.success('Payment marked as paid successfully');
        setShowMarkAsPaidDialog(false);
        await onPaymentUpdated();
      } else {
        toast.error('Failed to mark payment as paid');
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast.error('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    isProcessing,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleReschedulePayment,
    handleTakePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment
  };
};
