
import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { Payment } from '@/types/payment';

export const useRefundState = () => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  
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

  const processRefund = (amount?: number) => {
    if (paymentToRefund) {
      // Explicitly pass the payment ID to handleRefund
      handleRefund(amount, paymentToRefund);
      setRefundDialogOpen(false);
    } else {
      console.error('No payment ID available for refund');
    }
  };
  
  return {
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    setPaymentToRefund,
    openRefundDialog,
    processRefund
  };
};
