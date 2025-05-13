
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import DashboardContext from '@/contexts/DashboardContext';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { usePaymentStats } from '@/hooks/usePaymentStats';
import { usePayments } from '@/hooks/usePayments';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'; 
import { supabase } from '@/integrations/supabase/client';
import { getUserClinicId } from '@/utils/userUtils';
import { Payment, PaymentLink, PaymentStats } from '@/types/payment';

interface DashboardDataProviderProps {
  children: ReactNode;
}

export const DashboardDataProvider: React.FC<DashboardDataProviderProps> = ({ children }) => {
  const { user, clinicId } = useUnifiedAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment state
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  // Hook dependencies are managed through the clinic ID from UnifiedAuth
  const { 
    payments,
    isLoadingPayments,
    fetchPayments, 
    error: paymentsError 
  } = usePayments();
  
  const { 
    links: paymentLinks,
    archivedLinks, 
    loading: linksLoading, 
    refresh: refreshLinks, 
    error: linksError,
    archiveLink,
    unarchiveLink
  } = usePaymentLinks();
  
  const { 
    stats, 
    isLoadingStats, 
    fetchStats, 
    error: statsError 
  } = usePaymentStats();

  const isLoading = isLoadingPayments || linksLoading || isLoadingStats || !isInitialized;

  // Combine errors if any exist
  useEffect(() => {
    if (paymentsError || linksError || statsError) {
      setError(paymentsError || linksError || statsError);
    } else {
      setError(null);
    }
  }, [paymentsError, linksError, statsError]);

  // Initialize when the component mounts
  useEffect(() => {
    if (user && clinicId) {
      setIsInitialized(true);
    }
  }, [user, clinicId]);

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const openRefundDialog = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setPaymentToRefund(paymentId);
      setRefundDialogOpen(true);
    }
  };

  const handleRefund = async (amount?: number, paymentId?: string) => {
    const idToRefund = paymentId || paymentToRefund;
    if (!idToRefund) return;
    
    setIsProcessingRefund(true);
    
    try {
      // Call refund API or service
      console.log(`Processing refund for payment ${idToRefund}, amount: ${amount}`);
      
      // After successful refund
      fetchPayments();
      fetchStats();
      setRefundDialogOpen(false);
      setPaymentToRefund(null);
    } catch (error) {
      console.error('Refund error:', error);
      setError('Failed to process refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const archivePaymentLink = async (linkId: string) => {
    setIsArchiveLoading(true);
    try {
      const result = await archiveLink(linkId);
      if (result) {
        refreshLinks();
        return { success: true };
      }
      return { success: false, error: 'Failed to archive link' };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const unarchivePaymentLink = async (linkId: string) => {
    setIsArchiveLoading(true);
    try {
      const result = await unarchiveLink(linkId);
      if (result) {
        refreshLinks();
        return { success: true };
      }
      return { success: false, error: 'Failed to unarchive link' };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const refreshData = () => {
    if (!user || !clinicId) {
      console.log('[DASHBOARD] Cannot refresh - no user or clinic ID');
      return;
    }
    
    console.log('[DASHBOARD] Refreshing all dashboard data');
    fetchPayments();
    refreshLinks();
    fetchStats();
  };

  return (
    <DashboardContext.Provider
      value={{
        payments,
        paymentLinks,
        archivedLinks,
        stats,
        selectedPayment,
        detailDialogOpen,
        refundDialogOpen,
        paymentToRefund,
        isLoading,
        isProcessingRefund,
        isArchiveLoading,
        setDetailDialogOpen,
        setRefundDialogOpen,
        handlePaymentClick,
        openRefundDialog,
        handleRefund,
        archivePaymentLink,
        unarchivePaymentLink,
        rawPaymentLinks: paymentLinks,
        error
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export { useDashboardData } from '@/contexts/DashboardContext';
