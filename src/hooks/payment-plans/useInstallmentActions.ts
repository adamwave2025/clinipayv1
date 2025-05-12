
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
  const [paymentData, setPaymentData] = useState<PlanInstallment | null>(null);
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  const [showTakePaymentDialog, setShowTakePaymentDialog] = useState(false);
  
  // Use the payment reschedule actions hook with proper destructuring
  const rescheduleActions = usePaymentRescheduleActions(planId, onPaymentUpdated);

  const handleMarkAsPaid = (paymentId: string, installmentDetails?: PlanInstallment) => {
    console.log("[useInstallmentActions] Opening mark as paid dialog for", paymentId);
    
    // Set the selected installment with the provided details if available
    if (installmentDetails) {
      // Use the actual installment data that was passed in
      setSelectedInstallment(installmentDetails);
    } else {
      // Just set the ID if no details provided - simplified approach
      setSelectedInstallment({ 
        id: paymentId,
        status: 'pending'
      } as PlanInstallment);
    }
    
    setShowMarkAsPaidDialog(true);
  };
  
  const handleOpenReschedule = (paymentId: string) => {
    console.log("[useInstallmentActions] Opening reschedule dialog for payment", paymentId);
    
    rescheduleActions.handleOpenRescheduleDialog(paymentId);
    console.log("[useInstallmentActions] After calling handleOpenRescheduleDialog");
  };
  
  // Improved validation and data handling for the take payment action
  const handleTakePayment = (paymentId: string, installmentDetails: PlanInstallment) => {
    console.log("[useInstallmentActions] Take payment requested for ID:", paymentId);
    
    // Validate payment ID early
    if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
      console.error("[useInstallmentActions] Invalid payment ID:", paymentId);
      toast.error("Cannot process payment: Invalid payment ID");
      return;
    }
    
    // Validate installment details
    if (!installmentDetails || typeof installmentDetails !== 'object') {
      console.error("[useInstallmentActions] Invalid installment details:", installmentDetails);
      toast.error("Cannot process payment: Missing payment details");
      return;
    }
    
    if (!installmentDetails.amount || typeof installmentDetails.amount !== 'number') {
      console.error("[useInstallmentActions] Invalid amount in installment:", installmentDetails);
      toast.error("Cannot process payment: Invalid payment amount");
      return;
    }
    
    // Update state BEFORE showing dialog - critical fix!
    setSelectedInstallment(installmentDetails);
    setPaymentData(installmentDetails);
    
    console.log("[useInstallmentActions] Payment data set, opening dialog with:", { 
      id: paymentId,
      amount: installmentDetails.amount
    });
    
    // Only show the dialog once the state is updated
    setTimeout(() => {
      setShowTakePaymentDialog(true);
    }, 10);
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
    paymentData,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleTakePayment,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment,
    setSelectedInstallment, // Add this to expose the setter
    // Take payment dialog state
    showTakePaymentDialog,
    setShowTakePaymentDialog,
    // Expose the reschedule actions directly for clarity
    rescheduleDialog: rescheduleActions.showRescheduleDialog,
    setRescheduleDialog: rescheduleActions.setShowRescheduleDialog,
    handleReschedulePayment: rescheduleActions.handleReschedulePayment
  };
};
