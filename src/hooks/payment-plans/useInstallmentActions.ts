
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { usePaymentRescheduleActions } from './usePaymentRescheduleActions';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

export const useInstallmentActions = (
  planId: string,
  onPaymentUpdated: () => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  const [showTakePaymentDialog, setShowTakePaymentDialog] = useState(false);
  
  // Use the payment reschedule actions hook with proper destructuring
  const rescheduleActions = usePaymentRescheduleActions(planId, onPaymentUpdated);

  const handleMarkAsPaid = (paymentId: string) => {
    console.log("[useInstallmentActions] Opening mark as paid dialog for", paymentId);
    toast.info(`Opening Mark as Paid dialog for payment ${paymentId}`);
    
    // Find the selected installment
    setSelectedInstallment({ id: paymentId } as PlanInstallment);
    setShowMarkAsPaidDialog(true);
  };
  
  const handleOpenReschedule = (paymentId: string) => {
    console.log("[useInstallmentActions] Opening reschedule dialog for payment", paymentId);
    toast.info(`Opening Reschedule dialog for payment ${paymentId}`);
    
    rescheduleActions.handleOpenRescheduleDialog(paymentId);
    console.log("[useInstallmentActions] After calling handleOpenRescheduleDialog");
  };
  
  const handleTakePayment = (paymentId: string, installmentDetails?: PlanInstallment) => {
    console.log("[useInstallmentActions] Take payment clicked for", paymentId, "with details:", installmentDetails);
    
    if (!installmentDetails || !installmentDetails.amount) {
      console.error("[useInstallmentActions] Missing installment details or amount:", installmentDetails);
      toast.error("Cannot take payment: Missing payment details");
      return;
    }
    
    toast.info(`Opening payment dialog for ${formatCurrency(installmentDetails.amount)}`);
    
    // Store the full installment details
    setSelectedInstallment(installmentDetails);
    console.log("[useInstallmentActions] Setting selectedInstallment to:", installmentDetails);
    
    // Wait a tick to ensure state is updated before showing dialog
    setTimeout(() => {
      setShowTakePaymentDialog(true);
      console.log("[useInstallmentActions] Dialog state updated:", {
        showTakePaymentDialog: true,
        selectedInstallment: installmentDetails
      });
    }, 0);
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
  
  // Helper function to format currency (copied from formatter utils for consistency)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(amount);
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
