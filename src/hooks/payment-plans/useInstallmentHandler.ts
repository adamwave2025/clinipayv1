
import { useState } from 'react';
import { usePaymentDetailsFetcher } from './usePaymentDetailsFetcher';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentRefundService } from '@/services/PaymentRefundService';

export const useInstallmentHandler = () => {
  // Renamed to avoid conflict with primary selectedInstallment
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { paymentData, fetchPaymentDetails, setPaymentData } = usePaymentDetailsFetcher();
  
  // Add refund dialog state - we'll expose these but they won't be used
  // since we're delegating to useRefundState in ManagePlansProvider
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);

  const handleViewPaymentDetails = async (installment: PlanInstallment) => {
    try {
      console.log('Viewing payment details for installment:', installment);
      
      // Don't try to fetch payment details for unpaid installments
      // Allow paid, refunded, and partially_refunded statuses
      if (installment.status === 'sent' || 
          installment.status === 'pending' || 
          installment.status === 'cancelled') {
        toast.error('No payment information available for unpaid installments');
        return;
      }

      // Store the selected installment
      setSelectedInstallment(installment);
      
      // Fetch payment details for this installment
      const details = await fetchPaymentDetails(installment);
      console.log('Fetched payment details:', details);
      
      if (details) {
        // Open the payment details dialog
        setShowPaymentDetails(true);
      } else {
        toast.error('Could not find payment information');
      }
    } catch (error) {
      console.error('Error handling payment details:', error);
      toast.error('Failed to load payment details');
    }
  };

  // These functions are kept for API compatibility but will be overridden by useRefundState
  const openRefundDialog = () => {
    if (paymentData && paymentData.id) {
      setPaymentToRefund(paymentData.id);
      setRefundDialogOpen(true);
    } else {
      console.error('No payment data available for refund');
      toast.error('Cannot process refund: No payment information available');
    }
  };

  // Add function to process the refund - also kept for API compatibility
  const processRefund = async (amountInPounds?: number) => {
    if (!paymentToRefund) {
      toast.error('No payment selected for refund');
      return;
    }
    
    try {
      toast.info('Processing refund...');
      
      const result = await PaymentRefundService.processRefund(paymentToRefund, amountInPounds);
      
      if (result.success) {
        toast.success('Payment has been refunded successfully');
        
        // Update the payment data to reflect the refund
        if (paymentData) {
          const updatedPayments = PaymentRefundService.getUpdatedPaymentAfterRefund(
            [paymentData], 
            paymentToRefund, 
            amountInPounds || paymentData.amount / 100
          );
          
          if (updatedPayments.length > 0) {
            setPaymentData(updatedPayments[0]);
          }
        }
        
        // Close the payment details dialog
        setRefundDialogOpen(false);
      } else {
        toast.error(`Refund failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('An error occurred while processing the refund');
    }
  };

  return {
    selectedInstallment,
    setSelectedInstallment,
    showPaymentDetails,
    setShowPaymentDetails,
    paymentData,
    handleViewPaymentDetails,
    // Add refund-related properties
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    openRefundDialog,
    processRefund
  };
};
