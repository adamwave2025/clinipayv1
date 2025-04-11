
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

      const newStats = { ...stats };

      newStats.totalReceivedToday = todayPayments
        .filter(p => p.status === 'paid' || p.status === 'partially_refunded')
        .reduce((sum, p) => {
          // For partially refunded payments, only count the non-refunded portion
          if (p.status === 'partially_refunded') {
            return sum + ((p.amount_paid || 0) - (p.refund_amount || 0));
          }
          return sum + (p.amount_paid || 0);
        }, 0);
      
      newStats.totalPendingToday = todayPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      
      newStats.totalReceivedMonth = monthPayments
        .filter(p => p.status === 'paid' || p.status === 'partially_refunded')
        .reduce((sum, p) => {
          if (p.status === 'partially_refunded') {
            return sum + ((p.amount_paid || 0) - (p.refund_amount || 0));
          }
          return sum + (p.amount_paid || 0);
        }, 0);
      
      // Count both fully refunded and partial refund amounts
      newStats.totalRefundedMonth = monthPayments
        .reduce((sum, p) => {
          if (p.status === 'refunded') {
            return sum + (p.amount_paid || 0);
          } else if (p.status === 'partially_refunded') {
            return sum + (p.refund_amount || 0);
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
