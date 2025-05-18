
import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { Payment } from '@/types/payment';

export const useRefundState = () => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get dashboard data for refund functionality
  const { handleRefund } = useDashboardData();
  
  const openRefundDialog = (paymentData: Payment | null) => {
    if (paymentData && paymentData.id) {
      setPaymentToRefund(paymentData.id);
      setRefundDialogOpen(true);
    } else {
      console.error('No payment data available for refund');
    }
  };

  const processRefund = async (amountInPounds?: number) => {
    if (!paymentToRefund) {
      console.error('No payment ID available for refund');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Amount is already in pounds from the dialog, pass it directly
      await handleRefund(amountInPounds, paymentToRefund);
      setRefundDialogOpen(false);
    } catch (error) {
      console.error('Error processing refund:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    setPaymentToRefund,
    openRefundDialog,
    processRefund,
    isLoading
  };
};
