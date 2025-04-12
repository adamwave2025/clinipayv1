
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
      console.log('Fetching admin stats...');
      
      // Fetch total clinics
      const { count: clinicsCount, error: clinicsError } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true });

      if (clinicsError) throw clinicsError;
      
      // Fetch payments data (paid, partially_refunded, and refunded status)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid, status, refund_amount, net_amount, platform_fee')
        .in('status', ['paid', 'partially_refunded', 'refunded']);

      if (paymentsError) throw paymentsError;
      
      console.log('Raw payments data:', paymentsData);
      
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
      
      console.log('Calculated totalPaymentsSum:', totalPaymentsSum);
      console.log('Calculated totalRefundsSum:', totalRefundsSum);
      
      // Calculate CliniPay revenue by summing all platform fees
      let clinipayRevenueAmount = 0;
      
      // First try to use actual recorded platform fees
      const recordedPlatformFees = paymentsData.reduce((sum, payment) => {
        return sum + (payment.platform_fee || 0) / 100; // Convert cents to pounds
      }, 0);
      
      if (recordedPlatformFees > 0) {
        clinipayRevenueAmount = recordedPlatformFees;
        console.log('Using recorded platform fees:', clinipayRevenueAmount);
      } else {
        // Fallback to calculating based on platform fee percentage
        const feePercentage = parseFloat(platformFee) / 100;
        clinipayRevenueAmount = totalPaymentsSum * feePercentage;
        console.log('Fee percentage:', feePercentage);
        console.log('Calculated revenue from percentage:', clinipayRevenueAmount);
      }
      
      setStats({
        totalClinics: clinicsCount || 0,
        totalPayments: totalPaymentsSum, // Removed division by 100 as values are already in pounds
        totalRefunds: totalRefundsSum, // Removed division by 100
        clinipayRevenue: clinipayRevenueAmount, // Removed division by 100
        paymentsChange: 12.5, // Placeholder values for trend
        revenueChange: 8.3,
        refundsChange: -2.1
      });
      
      console.log('Final stats set:', {
        totalClinics: clinicsCount || 0,
        totalPayments: totalPaymentsSum,
        totalRefunds: totalRefundsSum,
        clinipayRevenue: clinipayRevenueAmount
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
