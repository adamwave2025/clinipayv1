import React, { useState, useEffect } from 'react';
import { Payment, PaymentLink } from '@/types/payment';
import { toast } from 'sonner';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useAuth } from '@/contexts/AuthContext';
import DashboardContext, { useDashboardData } from '@/contexts/DashboardContext';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentStats } from '@/hooks/usePaymentStats';
import { PaymentRefundService } from '@/services/PaymentRefundService';
import { formatCurrency } from '@/utils/formatters';

export { useDashboardData } from '@/contexts/DashboardContext';

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    paymentLinks: rawPaymentLinks, 
    archivedLinks: rawArchivedLinks,
    isLoading: isLoadingLinks,
    isArchiveLoading,
    archivePaymentLink: apiArchiveLink,
    unarchivePaymentLink: apiUnarchiveLink
  } = usePaymentLinks();
  
  const { payments, setPayments, isLoadingPayments, fetchPayments } = usePayments();
  const { stats } = usePaymentStats();
  const { user } = useAuth();

  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<PaymentLink[]>([]);

  useEffect(() => {
    setPaymentLinks(rawPaymentLinks);
    setArchivedLinks(rawArchivedLinks);
  }, [rawPaymentLinks, rawArchivedLinks]);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  useEffect(() => {
    if (paymentLinks.length > 0) {
      fetchPayments(paymentLinks);
    }
  }, [paymentLinks]);

  const archivePaymentLink = async (linkId: string) => {
    const linkToArchive = paymentLinks.find(link => link.id === linkId);
    if (!linkToArchive) return { success: false, error: 'Link not found' };
    
    setPaymentLinks(prev => prev.filter(link => link.id !== linkId));
    setArchivedLinks(prev => [...prev, {...linkToArchive, isActive: false}]);
    
    const result = await apiArchiveLink(linkId);
    
    if (!result.success) {
      setPaymentLinks(prev => [...prev, linkToArchive]);
      setArchivedLinks(prev => prev.filter(link => link.id !== linkId));
      
      toast.error(`Failed to archive link: ${result.error || 'Unknown error'}`);
    }
    
    return result;
  };
  
  const unarchivePaymentLink = async (linkId: string) => {
    const linkToUnarchive = archivedLinks.find(link => link.id === linkId);
    if (!linkToUnarchive) return { success: false, error: 'Link not found' };
    
    setArchivedLinks(prev => prev.filter(link => link.id !== linkId));
    setPaymentLinks(prev => [...prev, {...linkToUnarchive, isActive: true}]);
    
    const result = await apiUnarchiveLink(linkId);
    
    if (!result.success) {
      setArchivedLinks(prev => [...prev, linkToUnarchive]);
      setPaymentLinks(prev => prev.filter(link => link.id !== linkId));
      
      toast.error(`Failed to unarchive link: ${result.error || 'Unknown error'}`);
    }
    
    return result;
  };

  const openRefundDialog = (paymentId: string) => {
    setPaymentToRefund(paymentId);
    setRefundDialogOpen(true);
  };

  const handleRefund = async (amount?: number) => {
    if (!paymentToRefund) return;
    
    const loadingToastId = toast.loading('Processing refund...');
    
    try {
      setIsProcessingRefund(true);
      
      const payment = payments.find(p => p.id === paymentToRefund);
      if (!payment) throw new Error('Payment not found');
      
      const refundAmount = amount || payment.amount;
      const epsilon = 0.001;
      const isFullRefund = Math.abs(payment.amount - refundAmount) < epsilon;

      const result = await PaymentRefundService.processRefund(paymentToRefund, refundAmount);
      
      toast.dismiss(loadingToastId);
      
      if (!result.success) {
        throw new Error(result.error || 'Refund processing failed');
      }
      
      setPayments(PaymentRefundService.getUpdatedPaymentAfterRefund(
        payments, 
        paymentToRefund, 
        refundAmount
      ));
      
      toast.success(
        isFullRefund 
          ? 'Payment refunded successfully' 
          : `Partial refund of ${formatCurrency(refundAmount)} processed successfully`
      );
      
      setRefundDialogOpen(false);
      setDetailDialogOpen(false);
      setPaymentToRefund(null);
      
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      
      console.error('Error refunding payment:', error);
      toast.error(`Failed to refund payment: ${error.message}`);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const value = {
    payments,
    paymentLinks,
    archivedLinks,
    stats,
    selectedPayment,
    detailDialogOpen,
    refundDialogOpen,
    paymentToRefund,
    isLoading: isLoadingLinks || isLoadingPayments,
    isProcessingRefund,
    isArchiveLoading,
    setDetailDialogOpen,
    setRefundDialogOpen,
    handlePaymentClick,
    openRefundDialog,
    handleRefund,
    archivePaymentLink,
    unarchivePaymentLink,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
