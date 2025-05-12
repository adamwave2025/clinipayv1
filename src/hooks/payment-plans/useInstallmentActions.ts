
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
    console.log("[useInstallmentActions] Take payment clicked for", paymentId, "with details:", 
      installmentDetails ? JSON.stringify(installmentDetails) : "NO DETAILS");
    
    if (!installmentDetails || !installmentDetails.amount) {
      console.error("[useInstallmentActions] Missing installment details or amount:", installmentDetails);
      toast.error("Cannot take payment: Missing payment details");
      return;
    }
    
    // Validate and ensure we have a complete installment object
    const validatedInstallment = validateInstallment(installmentDetails, paymentId);
    if (!validatedInstallment) {
      toast.error("Cannot process payment: Invalid payment data");
      return;
    }
    
    // CRITICAL FIX: Set the selectedInstallment state first, then show the dialog
    // without using setTimeout to ensure correct ordering
    console.log("[useInstallmentActions] Setting selectedInstallment with validated data:", validatedInstallment);
    setSelectedInstallment(validatedInstallment);
    
    // Log and show dialog
    toast.info(`Opening payment dialog for ${formatCurrency(validatedInstallment.amount)}`);
    setShowTakePaymentDialog(true);
  };
  
  // Helper function to validate installment data
  const validateInstallment = (
    installment: PlanInstallment, 
    paymentId: string
  ): PlanInstallment | null => {
    try {
      if (!installment || typeof installment !== 'object') {
        throw new Error('Invalid installment object');
      }
      
      if (!installment.amount) {
        throw new Error('Missing amount in installment');
      }
      
      // Create a deep clone to prevent reference issues
      return JSON.parse(JSON.stringify({
        ...installment,
        id: paymentId, // Ensure the ID is correct
        amount: installment.amount,
        paymentNumber: installment.paymentNumber || 1,
        totalPayments: installment.totalPayments || 1, 
        dueDate: installment.dueDate || new Date().toISOString(),
        status: installment.status || 'pending'
      }));
    } catch (error) {
      console.error("[useInstallmentActions] Failed to validate installment:", error);
      return null;
    }
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
