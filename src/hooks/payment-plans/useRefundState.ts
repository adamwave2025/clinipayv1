
import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { Payment } from '@/types/payment';

export const useRefundState = () => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get dashboard data for refund functionality
  const { handleRefund } = useDashboardData();
  
  // Updated to accept either a Payment object or a payment ID string
  const openRefundDialog = (paymentDataOrId: Payment | string) => {
    // Check if we received a Payment object or a string ID
    const paymentId = typeof paymentDataOrId === 'string' 
      ? paymentDataOrId 
      : paymentDataOrId?.id;
      
    if (paymentId) {
      setPaymentToRefund(paymentId);
      setRefundDialogOpen(true);
    } else {
      console.error('No payment ID available for refund');
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
