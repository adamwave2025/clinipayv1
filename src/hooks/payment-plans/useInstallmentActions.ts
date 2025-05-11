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
    
    // FIXED: First update the selectedInstallment state
    console.log("[useInstallmentActions] Setting selectedInstallment with complete data:", installmentDetails);
    
    // Ensure we have a complete installment object with all necessary data
    const completeInstallment = {
      ...installmentDetails,
      id: paymentId,
      // Make sure these fields are defined if they're used in the dialog
      amount: installmentDetails.amount,
      paymentNumber: installmentDetails.paymentNumber || 1,
      totalPayments: installmentDetails.totalPayments || 1,
      dueDate: installmentDetails.dueDate || new Date().toISOString(),
    };
    
    // CRITICAL FIX: Update state then show dialog SYNCHRONOUSLY, no setTimeout
    setSelectedInstallment(completeInstallment);
    toast.info(`Opening payment dialog for ${formatCurrency(completeInstallment.amount)}`);
    setShowTakePaymentDialog(true);
    
    // Debug log to confirm state after update
    console.log("[useInstallmentActions] Dialog opened with installment:", completeInstallment);
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
