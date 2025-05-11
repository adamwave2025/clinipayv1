
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
  const [showTakePaymentDialog, setShowTakePaymentDialog] = useState(false);
  
  // Use the payment reschedule actions hook with proper destructuring
  const rescheduleActions = usePaymentRescheduleActions(planId, onPaymentUpdated);

  const handleMarkAsPaid = (paymentId: string) => {
    console.log("Opening mark as paid dialog for", paymentId);
    // Find the selected installment
    setSelectedInstallment({ id: paymentId });
    setShowMarkAsPaidDialog(true);
  };
  
  const handleOpenReschedule = (paymentId: string) => {
    console.log("useInstallmentActions: Opening reschedule dialog for payment", paymentId);
    rescheduleActions.handleOpenRescheduleDialog(paymentId);
    console.log("useInstallmentActions: After calling handleOpenRescheduleDialog");
  };
  
  const handleTakePayment = (paymentId: string, installmentDetails?: any) => {
    console.log("Take payment clicked for", paymentId);
    // Store the selected installment with all details we need
    setSelectedInstallment(installmentDetails || { id: paymentId });
    setShowTakePaymentDialog(true);
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
    handleTakePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment,
    // Take payment dialog state
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    // Expose the reschedule actions directly for clarity
    rescheduleDialog: rescheduleActions.showRescheduleDialog,
    setRescheduleDialog: rescheduleActions.setShowRescheduleDialog,
    handleReschedulePayment: rescheduleActions.handleReschedulePayment
  };
};
