
import { useState } from 'react';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import { PaymentRefundService } from '@/services/PaymentRefundService';

export const useRefundState = () => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  
  // Get dashboard data for refund functionality
  const { handleRefund: dashboardHandleRefund } = useDashboardData();
  
  const openRefundDialog = (paymentData: Payment | null) => {
    if (paymentData && paymentData.id) {
      setPaymentToRefund(paymentData.id);
      setRefundDialogOpen(true);
    } else {
      console.error('No payment data available for refund');
      toast.error('Cannot process refund: No payment information available');
    }
  };

  const processRefund = async (amountInPounds?: number) => {
    if (paymentToRefund) {
      try {
        const result = await PaymentRefundService.processRefund(paymentToRefund, amountInPounds);
        if (result.success) {
          toast.success('Payment has been refunded successfully');
          setRefundDialogOpen(false);
        } else {
          toast.error(`Refund failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error processing refund:', error);
        toast.error('An error occurred while processing the refund');
      }
    } else {
      console.error('No payment ID available for refund');
      toast.error('Cannot process refund: No payment selected');
    }
  };
  
  // Create a wrapper function that handles both contexts
  const handleRefund = (amountInPounds?: number, paymentId?: string) => {
    if (paymentId) {
      // If a payment ID is provided, use it (this comes from PaymentHistory)
      if (dashboardHandleRefund) {
        dashboardHandleRefund(amountInPounds, paymentId);
      } else {
        // Fallback to our own implementation if dashboardHandleRefund is not available
        setPaymentToRefund(paymentId);
        processRefund(amountInPounds);
      }
    } else {
      // If no payment ID is provided, use the current paymentToRefund
      processRefund(amountInPounds);
    }
  };
  
  return {
    refundDialogOpen,
    setRefundDialogOpen,
    paymentToRefund,
    setPaymentToRefund,
    openRefundDialog,
    processRefund,
    handleRefund
  };
};
