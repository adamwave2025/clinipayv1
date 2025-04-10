import React, { createContext, useContext, useState, useEffect } from 'react';
import { Payment, PaymentLink, PaymentStats } from '@/types/payment';
import { toast } from 'sonner';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DashboardContextType {
  payments: Payment[];
  paymentLinks: PaymentLink[];
  stats: PaymentStats;
  selectedPayment: Payment | null;
  detailDialogOpen: boolean;
  refundDialogOpen: boolean;
  paymentToRefund: string | null;
  isLoading: boolean;
  setDetailDialogOpen: (open: boolean) => void;
  setRefundDialogOpen: (open: boolean) => void;
  handlePaymentClick: (payment: Payment) => void;
  openRefundDialog: (paymentId: string) => void;
  handleRefund: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboardData = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { paymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const { user } = useAuth();

  const stats: PaymentStats = {
    totalReceivedToday: 0,
    totalPendingToday: 0,
    totalReceivedMonth: 0,
    totalRefundedMonth: 0,
  };

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      setIsLoadingPayments(true);
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('clinic_id')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        if (!userData.clinic_id) return;

        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('clinic_id', userData.clinic_id)
          .order('paid_at', { ascending: false });

        if (error) throw error;

        const formattedPayments: Payment[] = data.map(payment => ({
          id: payment.id,
          patientName: payment.patient_name || 'Unknown Patient',
          patientEmail: payment.patient_email,
          patientPhone: payment.patient_phone ? String(payment.patient_phone) : undefined,
          amount: payment.amount_paid || 0,
          date: new Date(payment.paid_at || Date.now()).toLocaleDateString(),
          status: payment.status as any || 'paid',
          type: 'consultation', // Default type
        }));

        setPayments(formattedPayments);

        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const todayPayments = data.filter(p => 
          p.paid_at && new Date(p.paid_at).toDateString() === today
        );
        
        const monthPayments = data.filter(p => 
          p.paid_at && 
          new Date(p.paid_at).getMonth() === thisMonth && 
          new Date(p.paid_at).getFullYear() === thisYear
        );

        stats.totalReceivedToday = todayPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        
        stats.totalPendingToday = todayPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        
        stats.totalReceivedMonth = monthPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        
        stats.totalRefundedMonth = monthPayments
          .filter(p => p.status === 'refunded')
          .reduce((sum, p) => sum + (p.amount_paid || 0), 0);

      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setIsLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [user]);

  const openRefundDialog = (paymentId: string) => {
    setPaymentToRefund(paymentId);
    setRefundDialogOpen(true);
  };

  const handleRefund = async () => {
    if (!paymentToRefund) return;
    
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentToRefund);

      if (error) throw error;
      
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === paymentToRefund
            ? { ...payment, status: 'refunded' as const }
            : payment
        )
      );
      
      setRefundDialogOpen(false);
      setDetailDialogOpen(false);
      
      toast.success('Payment refunded successfully');
      setPaymentToRefund(null);
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      toast.error('Failed to refund payment');
    }
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const value = {
    payments,
    paymentLinks,
    stats,
    selectedPayment,
    detailDialogOpen,
    refundDialogOpen,
    paymentToRefund,
    isLoading: isLoadingLinks || isLoadingPayments,
    setDetailDialogOpen,
    setRefundDialogOpen,
    handlePaymentClick,
    openRefundDialog,
    handleRefund,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
