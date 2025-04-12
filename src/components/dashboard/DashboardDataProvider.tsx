
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

  // Local state for payment links and archived links to enable immediate UI updates
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<PaymentLink[]>([]);

  // Update local state when data from API changes
  useEffect(() => {
    setPaymentLinks(rawPaymentLinks);
    setArchivedLinks(rawArchivedLinks);
  }, [rawPaymentLinks, rawArchivedLinks]);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Fetch payments with payment links when paymentLinks are ready
  useEffect(() => {
    if (paymentLinks.length > 0) {
      fetchPayments(paymentLinks);
    }
  }, [paymentLinks]);

  // Archive payment link with optimistic UI update
  const archivePaymentLink = async (linkId: string) => {
    // Find the link to be archived
    const linkToArchive = paymentLinks.find(link => link.id === linkId);
    if (!linkToArchive) return { success: false, error: 'Link not found' };
    
    // Optimistic UI update - move from active to archived
    setPaymentLinks(prev => prev.filter(link => link.id !== linkId));
    setArchivedLinks(prev => [...prev, {...linkToArchive, isActive: false}]);
    
    // Make the API call
    const result = await apiArchiveLink(linkId);
    
    // If API call fails, revert the optimistic update
    if (!result.success) {
      setPaymentLinks(prev => [...prev, linkToArchive]);
      setArchivedLinks(prev => prev.filter(link => link.id !== linkId));
      
      toast.error(`Failed to archive link: ${result.error || 'Unknown error'}`);
    }
    
    return result;
  };
  
  // Unarchive payment link with optimistic UI update
  const unarchivePaymentLink = async (linkId: string) => {
    // Find the link to be unarchived
    const linkToUnarchive = archivedLinks.find(link => link.id === linkId);
    if (!linkToUnarchive) return { success: false, error: 'Link not found' };
    
    // Optimistic UI update - move from archived to active
    setArchivedLinks(prev => prev.filter(link => link.id !== linkId));
    setPaymentLinks(prev => [...prev, {...linkToUnarchive, isActive: true}]);
    
    // Make the API call
    const result = await apiUnarchiveLink(linkId);
    
    // If API call fails, revert the optimistic update
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
    
    // Show loading toast
    const loadingToastId = toast.loading('Processing refund...');
    
    try {
      setIsProcessingRefund(true);
      
      const payment = payments.find(p => p.id === paymentToRefund);
      if (!payment) throw new Error('Payment not found');
      
      const refundAmount = amount || payment.amount; // Use provided amount or default to full payment
      // Determine if this is a full refund with epsilon for floating point comparison
      const epsilon = 0.001;
      const isFullRefund = Math.abs(payment.amount - refundAmount) < epsilon;

      const result = await PaymentRefundService.processRefund(paymentToRefund, refundAmount);
      
      // Always dismiss the loading toast
      toast.dismiss(loadingToastId);
      
      if (!result.success) {
        throw new Error(result.error || 'Refund processing failed');
      }
      
      // Update the payments state with the new status and refund info
      setPayments(PaymentRefundService.getUpdatedPaymentAfterRefund(
        payments, 
        paymentToRefund, 
        refundAmount
      ));
      
      // Show success toast
      toast.success(
        isFullRefund 
          ? 'Payment refunded successfully' 
          : `Partial refund of ${formatCurrency(refundAmount)} processed successfully`
      );
      
      // Reset UI state
      setRefundDialogOpen(false);
      setDetailDialogOpen(false);
      setPaymentToRefund(null);
      
    } catch (error: any) {
      // Always dismiss the loading toast
      toast.dismiss(loadingToastId);
      
      console.error('Error refunding payment:', error);
      toast.error(`Failed to refund payment: ${error.message}`);
    } finally {
      // Always reset the processing state to prevent UI lockups
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
