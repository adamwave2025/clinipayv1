
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformFee } from './useAdminSettings';
import { toast } from 'sonner';

export interface AdminStats {
  totalClinics: number;
  totalPayments: number;
  totalRefunds: number;
  clinipayRevenue: number;
  paymentsChange: number;
  revenueChange: number;
  refundsChange: number;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalClinics: 0,
    totalPayments: 0,
    totalRefunds: 0,
    clinipayRevenue: 0,
    paymentsChange: 12.5, // Default placeholder values for trend
    revenueChange: 8.3,
    refundsChange: -2.1
  });
  const [loading, setLoading] = useState(true);
  const { platformFee, isLoading: feeLoading } = usePlatformFee();
  
  useEffect(() => {
    fetchStats();
  }, [platformFee]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total clinics
      const { count: clinicsCount, error: clinicsError } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true });

      if (clinicsError) throw clinicsError;
      
      // Fetch payments data (paid, partially_refunded, and refunded status)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid, status, refund_amount')
        .in('status', ['paid', 'partially_refunded', 'refunded']);

      if (paymentsError) throw paymentsError;
      
      // Calculate total payments (sum of all paid amounts minus refunded amounts)
      const totalPaymentsSum = paymentsData.reduce((sum, payment) => {
        if (payment.status === 'paid') {
          return sum + (payment.amount_paid || 0);
        } else if (payment.status === 'partially_refunded') {
          // For partially refunded payments, subtract the refunded amount
          const remainingAmount = (payment.amount_paid || 0) - (payment.refund_amount || 0);
          return sum + Math.max(0, remainingAmount); // Ensure we don't add negative values
        }
        return sum;
      }, 0);
      
      // Calculate total refunds (sum of all refunded amounts)
      const totalRefundsSum = paymentsData.reduce((sum, payment) => {
        if (payment.status === 'refunded') {
          return sum + (payment.amount_paid || 0);
        } else if (payment.status === 'partially_refunded') {
          return sum + (payment.refund_amount || 0);
        }
        return sum;
      }, 0);
      
      // Calculate CliniPay revenue (platform fee percentage of total payments)
      const feePercentage = parseFloat(platformFee) / 100;
      const clinipayRevenueAmount = totalPaymentsSum * feePercentage;

      setStats({
        totalClinics: clinicsCount || 0,
        totalPayments: totalPaymentsSum / 100, // Convert from cents to pounds
        totalRefunds: totalRefundsSum / 100, // Convert from cents to pounds
        clinipayRevenue: clinipayRevenueAmount / 100, // Convert from cents to pounds
        paymentsChange: 12.5, // Placeholder values for trend
        revenueChange: 8.3,
        refundsChange: -2.1
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetchStats: fetchStats };
}
