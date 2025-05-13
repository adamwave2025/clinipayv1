
import { useState, useEffect } from 'react';
import { PaymentStats } from '@/types/payment';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentStats = () => {
  const [stats, setStats] = useState<PaymentStats>({
    totalReceivedToday: 0,
    totalPendingToday: 0,
    totalReceivedMonth: 0,
    totalRefundedMonth: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clinicId } = useUnifiedAuth();

  const fetchStats = async () => {
    if (!clinicId) {
      console.warn('No clinic ID available for stats');
      setError('No clinic ID available');
      return;
    }

    setIsLoadingStats(true);
    setError(null);
    
    try {
      // Example: Fetch today's received payments
      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      // Get today's received payments
      const { data: todayData, error: todayError } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('clinic_id', clinicId)
        .eq('status', 'paid')
        .gte('paid_at', today);
        
      if (todayError) {
        setError(todayError.message);
        throw todayError;
      }
      
      // Get this month's received payments
      const { data: monthData, error: monthError } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('clinic_id', clinicId)
        .eq('status', 'paid')
        .gte('paid_at', firstOfMonth);
        
      if (monthError) {
        setError(monthError.message);
        throw monthError;
      }
      
      // Get this month's refunded payments
      const { data: refundedData, error: refundedError } = await supabase
        .from('payments')
        .select('refund_amount')
        .eq('clinic_id', clinicId)
        .eq('status', 'refunded')
        .gte('refunded_at', firstOfMonth);
        
      if (refundedError) {
        setError(refundedError.message);
        throw refundedError;
      }
      
      // Calculate totals
      const totalReceivedToday = todayData?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;
      const totalReceivedMonth = monthData?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;
      const totalRefundedMonth = refundedData?.reduce((sum, payment) => sum + (payment.refund_amount || 0), 0) || 0;
      
      setStats({
        totalReceivedToday,
        totalPendingToday: 0, // Would need another query
        totalReceivedMonth,
        totalRefundedMonth
      });
    } catch (e) {
      console.error('Exception in fetchStats:', e);
      setError('Failed to fetch payment stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  return { 
    stats, 
    isLoadingStats, 
    fetchStats,
    error 
  };
};
