
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PlanPaymentService } from '@/services/plan-operations/PlanPaymentService';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

export const useInstallmentActions = (
  planId: string,
  onRefresh: () => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);
  
  // Add state for mark as paid confirmation dialog
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);

  const handleMarkAsPaid = async (installmentId: string) => {
    try {
      // Find the installment data to display in the confirmation dialog
      // Use payment_schedule table instead of payment_plan_installments
      const { data: installment, error } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', installmentId)
        .single();
        
      if (error) {
        console.error('Error fetching installment details:', error);
        toast.error('Could not find payment details');
        return;
      }
        
      if (installment) {
        // Convert to PlanInstallment type
        const planInstallment: PlanInstallment = {
          id: installment.id,
          dueDate: installment.due_date,
          amount: installment.amount,
          status: installment.status,
          paidDate: null,
          paymentNumber: installment.payment_number,
          totalPayments: installment.total_payments,
          paymentRequestId: installment.payment_request_id,
          originalStatus: installment.status,
          plan_id: installment.plan_id,
          manualPayment: false
        };
        
        setSelectedInstallment(planInstallment);
        setSelectedInstallmentId(installmentId);
        setShowMarkAsPaidDialog(true);
      } else {
        toast.error('Could not find payment details');
      }
    } catch (error) {
      console.error('Error fetching installment details:', error);
      toast.error('Failed to load payment details');
    }
  };
  
  // New method to handle the actual payment marking after confirmation
  const confirmMarkAsPaid = async () => {
    if (!selectedInstallmentId) {
      toast.error('No payment selected');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Use the PlanPaymentService to record a manual payment
      const result = await PlanPaymentService.recordManualPayment(selectedInstallmentId, undefined, undefined);
      
      if (result.success) {
        toast.success('Payment marked as paid successfully');
        
        // Explicitly ensure the plan data is refreshed
        console.log('Refreshing plan data after manual payment');
        await onRefresh();
        
        // Force a refresh of the plan status as well
        if (planId) {
          console.log('Updating plan progress and status for plan:', planId);
          await PlanPaymentService.updatePlanAfterPayment(planId);
          
          // Call onRefresh again to ensure UI is updated with latest data
          setTimeout(async () => {
            await onRefresh();
          }, 300); // Small delay to ensure DB operations complete
        }
        
        // Close the dialog after successful operation
        setShowMarkAsPaidDialog(false);
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
    selectedInstallmentId,
    // Add new properties for mark as paid dialog
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    confirmMarkAsPaid,
    selectedInstallment
  };
};

