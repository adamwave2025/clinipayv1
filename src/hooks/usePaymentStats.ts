
import { useState, useEffect } from 'react';
import { PaymentStats } from '@/types/payment';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function usePaymentStats() {
  const [stats, setStats] = useState<PaymentStats>({
    totalReceivedToday: 0,
    totalPendingToday: 0,
    totalReceivedMonth: 0,
    totalRefundedMonth: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    setIsLoadingStats(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!userData.clinic_id) return;

      // Fetch completed payments for stats calculation
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('clinic_id', userData.clinic_id);

      if (paymentsError) throw paymentsError;

      // Fetch pending payment requests (status=sent)
      const { data: pendingRequestsData, error: pendingRequestsError } = await supabase
        .from('payment_requests')
        .select(`
          id, 
          custom_amount,
          payment_link_id,
          sent_at,
          payment_links(amount)
        `)
        .eq('clinic_id', userData.clinic_id)
        .eq('status', 'sent');

      if (pendingRequestsError) throw pendingRequestsError;

      // Calculate stats
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

      // Calculate pending amount from payment requests
      const todayPendingRequests = pendingRequestsData.filter(pr => 
        pr.sent_at && new Date(pr.sent_at).toDateString() === today
      );

      const newStats = { ...stats };

      // Monetary values in the database are stored in cents, divide by 100 to convert to pounds/dollars
      newStats.totalReceivedToday = todayPayments
        .filter(p => p.status === 'paid' || p.status === 'partially_refunded')
        .reduce((sum, p) => {
          // For partially refunded payments, only count the non-refunded portion
          if (p.status === 'partially_refunded') {
            return sum + (((p.amount_paid || 0) - (p.refund_amount || 0)) / 100);
          }
          return sum + ((p.amount_paid || 0) / 100);
        }, 0);
      
      // Calculate total pending amount from today's pending requests
      // Convert from cents to dollars/pounds by dividing by 100
      newStats.totalPendingToday = todayPendingRequests.reduce((sum, pr) => {
        // Use custom_amount if available, otherwise use amount from payment_link
        const requestAmount = pr.custom_amount || (pr.payment_links?.amount || 0);
        return sum + (requestAmount / 100);
      }, 0);
      
      newStats.totalReceivedMonth = monthPayments
        .filter(p => p.status === 'paid' || p.status === 'partially_refunded')
        .reduce((sum, p) => {
          // Convert from cents to dollars/pounds by dividing by 100
          if (p.status === 'partially_refunded') {
            return sum + (((p.amount_paid || 0) - (p.refund_amount || 0)) / 100);
          }
          return sum + ((p.amount_paid || 0) / 100);
        }, 0);
      
      // Count both fully refunded and partial refund amounts
      // Convert from cents to dollars/pounds by dividing by 100
      newStats.totalRefundedMonth = monthPayments
        .reduce((sum, p) => {
          if (p.status === 'refunded') {
            return sum + ((p.amount_paid || 0) / 100);
          } else if (p.status === 'partially_refunded') {
            return sum + ((p.refund_amount || 0) / 100);
          }
          return sum;
        }, 0);

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return {
    stats,
    isLoadingStats,
    fetchStats
  };
}
