
import { useState } from 'react';
import { usePaymentDetailsFetcher } from './usePaymentDetailsFetcher';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import { useRefundState } from './useRefundState';

export const useInstallmentHandler = () => {
  // Renamed to avoid conflict with primary selectedInstallment
  const [selectedInstallment, setSelectedInstallment] = useState<PlanInstallment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { paymentData, fetchPaymentDetails, setPaymentData } = usePaymentDetailsFetcher();
  const { 
    refundDialogOpen, 
    setRefundDialogOpen, 
    openRefundDialog, 
    processRefund 
  } = useRefundState();

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

  // Handle refund for a payment
  const handleRefund = () => {
    if (paymentData) {
      openRefundDialog(paymentData);
      setShowPaymentDetails(false); // Close the payment details dialog
    } else {
      toast.error('No payment data available for refund');
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
    handleRefund,
    processRefund
  };
};
