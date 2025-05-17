import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PlanOperationsService } from '@/services/PlanOperationsService';
import { PlanInstallment, formatInstallmentFromDb } from '@/utils/paymentPlanUtils';

/**
 * Maps database payment schedule data to PlanInstallment type
 */
const mapToPlanInstallment = (data: any): PlanInstallment => {
  return formatInstallmentFromDb(data);
};

export const useInstallmentActions = (
  planId: string, 
  refreshFunction: (planId: string) => Promise<void>
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
    console.log("useInstallmentActions: handleMarkAsPaid called with ID:", paymentId);
    
    // Fetch the installment data
    setIsProcessing(true);
    
    try {
      supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', paymentId)
        .single()
        .then(({ data: installmentData, error }) => {
          if (error) {
            console.error('Error fetching installment data:', error);
            toast.error('Error loading payment data');
            setIsProcessing(false);
            return;
          }
          
          console.log('Fetched installment data:', installmentData);
          setSelectedInstallment(mapToPlanInstallment(installmentData));
          setShowMarkAsPaidDialog(true);
          setIsProcessing(false);
        })
        .then(undefined, (error: Error) => { // Using .then with second error handler instead of .catch
          console.error('Unexpected error in handleMarkAsPaid:', error);
          toast.error('Unexpected error occurred');
          setIsProcessing(false);
        });
    } catch (error) {
      console.error('Error in handleMarkAsPaid outer try block:', error);
      toast.error('Error occurred while fetching payment data');
      setIsProcessing(false);
    }
  };
  
  // Handler for confirming Mark as Paid
  const confirmMarkAsPaid = async () => {
    if (!selectedInstallment) {
      toast.error('No payment selected');
      return;
    }
    
    console.log("useInstallmentActions: confirmMarkAsPaid called for installment:", selectedInstallment.id);
    setIsProcessing(true);
    
    try {
      // Use the PlanOperationsService to mark the payment as paid
      const success = await PlanOperationsService.markAsPaid(selectedInstallment.id, planId);
      
      if (success) {
        toast.success('Payment marked as paid');
        // Close the dialog
        setShowMarkAsPaidDialog(false);
        // Refresh the plan data to show the update
        await refreshFunction(planId);
      } else {
        toast.error('Failed to mark payment as paid');
      }
    } catch (error) {
      console.error('Error in confirmMarkAsPaid:', error);
      toast.error('An error occurred while processing your request');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handler for opening the Reschedule Payment dialog
  const handleOpenReschedule = (paymentId: string) => {
    console.log("useInstallmentActions: handleOpenReschedule called with ID:", paymentId);
    
    // Fetch the installment data
    setIsProcessing(true);
    
    try {
      supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', paymentId)
        .single()
        .then(({ data: installmentData, error }) => {
          if (error) {
            console.error('Error fetching installment data:', error);
            toast.error('Error loading payment data');
            setIsProcessing(false);
            return;
          }
          
          console.log('Fetched installment data for reschedule:', installmentData);
          setSelectedInstallment(mapToPlanInstallment(installmentData));
          setRescheduleDialog(true);
          setIsProcessing(false);
        })
        .then(undefined, (error: Error) => { // Using .then with second error handler instead of .catch
          console.error('Unexpected error in handleOpenReschedule:', error);
          toast.error('Unexpected error occurred');
          setIsProcessing(false);
        });
    } catch (error) {
      console.error('Error in handleOpenReschedule outer try block:', error);
      toast.error('Error occurred while fetching payment data');
      setIsProcessing(false);
    }
  };
  
  // Handler for rescheduling a payment
  const handleReschedulePayment = async (newDate: Date) => {
    if (!selectedInstallment || !planId) {
      toast.error("No payment selected for rescheduling");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log("Rescheduling payment to:", newDate);
      const result = await PlanOperationsService.reschedulePayment(
        selectedInstallment.id,
        newDate
      );
      
      if (result.success) {
        toast.success("Payment rescheduled successfully");
        
        // Close the dialog
        setRescheduleDialog(false);
        
        // Refresh the plan state to update UI
        if (refreshFunction) {
          await refreshFunction(planId);
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
  const handleTakePayment = (paymentId: string, installmentDetails?: any) => {
    console.log("useInstallmentActions: handleTakePayment called with ID:", paymentId);
    
    // If we have installment details directly, use them
    if (installmentDetails) {
      console.log('Using provided installment details:', installmentDetails);
      setSelectedInstallment(mapToPlanInstallment(installmentDetails));
      setShowTakePaymentDialog(true);
      return;
    }
    
    // Otherwise fetch the installment data
    setIsProcessing(true);
    
    try {
      supabase
        .from('payment_schedule')
        .select('*')
        .eq('id', paymentId)
        .single()
        .then(({ data: installmentData, error }) => {
          if (error) {
            console.error('Error fetching installment data:', error);
            toast.error('Error loading payment data');
            setIsProcessing(false);
            return;
          }
          
          console.log('Fetched installment data for payment:', installmentData);
          setSelectedInstallment(mapToPlanInstallment(installmentData));
          setShowTakePaymentDialog(true);
          setIsProcessing(false);
        })
        .then(undefined, (error: Error) => { // Using .then with second error handler instead of .catch
          console.error('Unexpected error in handleTakePayment:', error);
          toast.error('Unexpected error occurred');
          setIsProcessing(false);
        });
    } catch (error) {
      console.error('Error in handleTakePayment outer try block:', error);
      toast.error('Error occurred while fetching payment data');
      setIsProcessing(false);
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
