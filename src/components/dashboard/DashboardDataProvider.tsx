
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Payment, PaymentLink, PaymentStats } from '@/types/payment';
import { toast } from 'sonner';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';

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
  handleRefund: (amount?: number) => void;
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
    const fetchData = async () => {
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

        // Fetch completed payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('clinic_id', userData.clinic_id)
          .order('paid_at', { ascending: false });

        if (paymentsError) throw paymentsError;

        // Fetch sent payment requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('clinic_id', userData.clinic_id)
          .is('paid_at', null) // Only get unpaid/sent requests
          .order('sent_at', { ascending: false });

        if (requestsError) throw requestsError;

        // Format completed payments
        const formattedPayments: Payment[] = paymentsData.map(payment => ({
          id: payment.id,
          patientName: payment.patient_name || 'Unknown Patient',
          patientEmail: payment.patient_email,
          patientPhone: payment.patient_phone || undefined,
          amount: payment.amount_paid || 0,
          date: new Date(payment.paid_at || Date.now()).toLocaleDateString(),
          status: payment.status as any || 'paid',
          type: 'consultation', // Default type
          // If status is partially_refunded, include the refunded amount
          ...(payment.status === 'partially_refunded' && { refundedAmount: payment.refund_amount || 0 })
        }));

        // Format payment requests as "sent" payments
        const formattedRequests: Payment[] = requestsData.map(request => {
          // Determine amount - either from custom amount or linked payment link
          let amount = 0;
          if (request.custom_amount) {
            amount = request.custom_amount;
          } else if (request.payment_link_id) {
            const paymentLink = paymentLinks.find(link => link.id === request.payment_link_id);
            if (paymentLink) {
              amount = paymentLink.amount;
            }
          }

          // Create payment URL for testing
          const paymentUrl = `${window.location.origin}/payment/${request.id}`;

          return {
            id: request.id,
            patientName: request.patient_name || 'Unknown Patient',
            patientEmail: request.patient_email,
            patientPhone: request.patient_phone || undefined,
            amount: amount,
            date: new Date(request.sent_at || Date.now()).toLocaleDateString(),
            status: 'sent',
            type: 'consultation', // Default type
            paymentUrl: paymentUrl, // Add payment URL for testing
          };
        });

        // Combine both lists
        const allPayments = [...formattedPayments, ...formattedRequests];
        // Sort by date (newest first)
        allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setPayments(allPayments);

        // Calculate stats (using only completed payments, not requests)
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const todayPayments = paymentsData.filter(p => 
          p.paid_at && new Date(p.paid_at).toDateString() === today
        );
        
        const monthPayments = paymentsData.filter(p => 
          p.paid_at && 
          new Date(p.paid_at).getMonth() === thisMonth && 
          new Date(p.paid_at).getFullYear() === thisYear
        );

      stats.totalReceivedToday = todayPayments
        .filter(p => p.status === 'paid' || p.status === 'partially_refunded')
        .reduce((sum, p) => {
          // For partially refunded payments, only count the non-refunded portion
          if (p.status === 'partially_refunded') {
            return sum + ((p.amount_paid || 0) - (p.refund_amount || 0));
          }
          return sum + (p.amount_paid || 0);
        }, 0);
      
      stats.totalPendingToday = todayPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      
      stats.totalReceivedMonth = monthPayments
        .filter(p => p.status === 'paid' || p.status === 'partially_refunded')
        .reduce((sum, p) => {
          if (p.status === 'partially_refunded') {
            return sum + ((p.amount_paid || 0) - (p.refund_amount || 0));
          }
          return sum + (p.amount_paid || 0);
        }, 0);
      
      // Count both fully refunded and partial refund amounts
      stats.totalRefundedMonth = monthPayments
        .reduce((sum, p) => {
          if (p.status === 'refunded') {
            return sum + (p.amount_paid || 0);
          } else if (p.status === 'partially_refunded') {
            return sum + (p.refund_amount || 0);
          }
          return sum;
        }, 0);

      } catch (error) {
        console.error('Error fetching payments data:', error);
      } finally {
        setIsLoadingPayments(false);
      }
    };

    fetchData();
  }, [user, paymentLinks]);

  const openRefundDialog = (paymentId: string) => {
    setPaymentToRefund(paymentId);
    setRefundDialogOpen(true);
  };

  const handleRefund = async (amount?: number) => {
    if (!paymentToRefund) return;
    
    try {
      const payment = payments.find(p => p.id === paymentToRefund);
      if (!payment) throw new Error('Payment not found');
      
      const refundAmount = amount || payment.amount; // Use provided amount or default to full payment
      const isFullRefund = refundAmount === payment.amount;

      toast.loading('Processing refund...');
      
      // Call the refund-payment edge function
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: JSON.stringify({
          paymentId: paymentToRefund,
          refundAmount: refundAmount,
          fullRefund: isFullRefund
        })
      });
      
      // Dismiss the loading toast
      toast.dismiss();
      
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Refund processing failed');
      }
      
      // Update the payments state with the new status and refund info
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === paymentToRefund
            ? { 
                ...payment, 
                status: data.status as any,
                refundedAmount: refundAmount
              }
            : payment
        )
      );
      
      setRefundDialogOpen(false);
      setDetailDialogOpen(false);
      
      toast.success(
        isFullRefund 
          ? 'Payment refunded successfully' 
          : `Partial refund of ${formatCurrency(refundAmount)} processed successfully`
      );
      
      setPaymentToRefund(null);
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      toast.error(`Failed to refund payment: ${error.message}`);
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
