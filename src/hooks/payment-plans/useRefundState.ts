
import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { Payment } from '@/types/payment';

export const useRefundState = () => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  
  // Get dashboard data for refund functionality
  const { handleRefund } = useDashboardData();
  
  const openRefundDialog = (paymentId: string) => {
    if (paymentId) {
      setPaymentToRefund(paymentId);
      setRefundDialogOpen(true);
    } else {
      console.error('No payment data available for refund');
    }
  };

  const processRefund = (amountInPounds?: number) => {
    if (paymentToRefund) {
      // Amount is already in pounds from the dialog, pass it directly
      handleRefund(amountInPounds, paymentToRefund);
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
