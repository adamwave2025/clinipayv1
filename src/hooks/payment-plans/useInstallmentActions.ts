
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

/**
 * Maps database payment schedule data to PlanInstallment type
 */
const mapToPlanInstallment = (data: any): PlanInstallment => {
  return {
    id: data.id,
    amount: data.amount,
    planId: data.plan_id,
    dueDate: data.due_date,
    paidDate: data.paid_date || null,
    status: data.status,
    paymentNumber: data.payment_number,
    totalPayments: data.total_payments,
    paymentRequestId: data.payment_request_id,
    // Add any other fields needed for PlanInstallment
  };
};

export const useInstallmentActions = (
  planId: string, 
  refreshPlanState?: (planId: string) => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const navigate = useNavigate();
  
  // Mark as Paid dialog state
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  
  // Reschedule Payment dialog state
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  
  // Take Payment dialog state
  const [showTakePaymentDialog, setShowTakePaymentDialog] = useState(false);
  
  // Handler for opening the Mark as Paid dialog
  const handleMarkAsPaid = (paymentId: string) => {
    console.log("handleMarkAsPaid called for payment ID:", paymentId);
    
    if (!planId) {
      console.error("Cannot mark as paid: No plan ID available");
      toast.error("Cannot process payment: Missing plan ID");
      return;
    }
    
    // Find the installment by ID to display details in the confirmation
    supabase
      .from('payment_schedule')
      .select('*')
      .eq('id', paymentId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching installment:", error);
          toast.error("Failed to get payment details");
          return;
        }
        
        // Map to PlanInstallment type before setting it
        setSelectedInstallment(mapToPlanInstallment(data));
        
        // Open the confirmation dialog
        setShowMarkAsPaidDialog(true);
      });
  };
  
  // Handler for confirming Mark as Paid
  const confirmMarkAsPaid = async () => {
    if (!selectedInstallment || !planId) {
      toast.error("No payment selected");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Use the service to record a manual payment
      const result = await PlanOperationsService.recordManualPayment(selectedInstallment.id);
      
      if (result.success) {
        toast.success("Payment marked as paid successfully");
        
        // Close the dialog
        setShowMarkAsPaidDialog(false);
        
        // Refresh the plan state to update UI
        if (refreshPlanState) {
          await refreshPlanState(planId);
        }
      } else {
        toast.error("Failed to mark payment as paid");
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      toast.error("An error occurred while processing your request");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handler for opening the Reschedule Payment dialog
  const handleOpenReschedule = (paymentId: string) => {
    console.log("handleOpenReschedule called for payment ID:", paymentId);
    
    // Find the installment by ID
    supabase
      .from('payment_schedule')
      .select('*')
      .eq('id', paymentId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching installment:", error);
          toast.error("Failed to get payment details");
          return;
        }
        
        // Map to PlanInstallment type before setting it
        setSelectedInstallment(mapToPlanInstallment(data));
        
        // Open the reschedule dialog
        setRescheduleDialog(true);
      });
  };
  
  // Handler for rescheduling a payment
  const handleReschedulePayment = async (newDate: Date) => {
    if (!selectedInstallment || !planId) {
      toast.error("No payment selected for rescheduling");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await PlanOperationsService.reschedulePayment(
        selectedInstallment.id,
        newDate
      );
      
      if (result.success) {
        toast.success("Payment rescheduled successfully");
        
        // Close the dialog
        setRescheduleDialog(false);
        
        // Refresh the plan state to update UI
        if (refreshPlanState) {
          await refreshPlanState(planId);
        }
      } else {
        toast.error("Failed to reschedule payment");
      }
    } catch (error) {
      console.error("Error rescheduling payment:", error);
      toast.error("An error occurred while rescheduling the payment");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handler for taking a payment via the payment portal
  const handleTakePayment = (paymentId: string, installmentDetails?: PlanInstallment) => {
    console.log("handleTakePayment called for payment ID:", paymentId);
    
    if (!installmentDetails) {
      // Try to fetch the installment details if not provided
      supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', paymentId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching installment:", error);
            toast.error("Failed to get payment details");
            return;
          }
          
          // Map to PlanInstallment type before setting
          setSelectedInstallment(mapToPlanInstallment(data));
          setShowTakePaymentDialog(true);
        });
    } else {
      // Use the provided installment details directly
      setSelectedInstallment(installmentDetails);
      setShowTakePaymentDialog(true);
    }
  };

  return {
    isProcessing,
    selectedInstallment,
    setSelectedInstallment,
    handleMarkAsPaid,
    handleOpenReschedule,
    handleTakePayment,
    confirmMarkAsPaid,
    showMarkAsPaidDialog,
    setShowMarkAsPaidDialog,
    rescheduleDialog,
    setRescheduleDialog,
    handleReschedulePayment,
    showTakePaymentDialog,
    setShowTakePaymentDialog
  };
};
