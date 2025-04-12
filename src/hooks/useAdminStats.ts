
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformFee } from './useAdminSettings';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { format, subMonths } from 'date-fns';

export interface AdminStats {
  totalClinics: number;
  totalPayments: number;
  totalRefunds: number;
  clinipayRevenue: number;
  paymentsChange: number;
  revenueChange: number;
  refundsChange: number;
}

export function useAdminStats(dateRange?: DateRange) {
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
  }, [platformFee, dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      console.log('Fetching admin stats with date range:', dateRange);
      
      // Fetch total clinics
      const { count: clinicsCount, error: clinicsError } = await supabase
        .from('clinics')
        .select('*', { count: 'exact', head: true });

      if (clinicsError) throw clinicsError;
      
      // Prepare date filters
      let dateFilter = {};
      let previousPeriodFilter = {};
      
      if (dateRange?.from && dateRange?.to) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        const toDate = format(dateRange.to, 'yyyy-MM-dd');
        
        dateFilter = {
          paid_at: {
            gte: fromDate,
            lte: toDate + 'T23:59:59'
          }
        };
        
        // Calculate previous period of same length for trend calculation
        const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
        const previousFrom = new Date(dateRange.from.getTime() - periodLength);
        const previousTo = new Date(dateRange.from.getTime() - 1);
        
        previousPeriodFilter = {
          paid_at: {
            gte: format(previousFrom, 'yyyy-MM-dd'),
            lte: format(previousTo, 'yyyy-MM-dd') + 'T23:59:59'
          }
        };
      }
      
      // Fetch payments data for current period
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid, status, refund_amount, net_amount, platform_fee, stripe_fee')
        .in('status', ['paid', 'partially_refunded', 'refunded'])
        .match(dateFilter);

      if (paymentsError) throw paymentsError;
      
      console.log('Raw payments data:', paymentsData);
      
      // Fetch payments data for previous period (for trend calculation)
      const { data: previousPaymentsData, error: previousPaymentsError } = await supabase
        .from('payments')
        .select('amount_paid, status, refund_amount, platform_fee, stripe_fee')
        .in('status', ['paid', 'partially_refunded', 'refunded'])
        .match(previousPeriodFilter);

      if (previousPaymentsError) throw previousPaymentsError;
      
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
      
      // Calculate previous period payments for trend
      const previousTotalPaymentsSum = previousPaymentsData.reduce((sum, payment) => {
        if (payment.status === 'paid') {
          return sum + (payment.amount_paid || 0);
        } else if (payment.status === 'partially_refunded') {
          const remainingAmount = (payment.amount_paid || 0) - (payment.refund_amount || 0);
          return sum + Math.max(0, remainingAmount);
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
      
      // Calculate previous period refunds for trend
      const previousTotalRefundsSum = previousPaymentsData.reduce((sum, payment) => {
        if (payment.status === 'refunded') {
          return sum + (payment.amount_paid || 0);
        } else if (payment.status === 'partially_refunded') {
          return sum + (payment.refund_amount || 0);
        }
        return sum;
      }, 0);
      
      console.log('Calculated totalPaymentsSum:', totalPaymentsSum);
      console.log('Calculated totalRefundsSum:', totalRefundsSum);
      
      // Calculate CliniPay revenue as platform_fee minus stripe_fee
      // Note: Both values are stored in cents, so we need to divide by 100 for display
      let clinipayRevenueAmount = 0;
      
      clinipayRevenueAmount = paymentsData.reduce((sum, payment) => {
        // Calculate net platform fee (platform_fee - stripe_fee)
        const platformFeeAmount = payment.platform_fee || 0;
        const stripeFeeAmount = payment.stripe_fee || 0;
        
        // Calculate the actual revenue CliniPay receives (after Stripe's cut)
        const paymentRevenue = Math.max(0, platformFeeAmount - stripeFeeAmount);
        return sum + (paymentRevenue / 100); // Convert cents to pounds
      }, 0);
      
      // Calculate previous period revenue for trend
      const previousClinicpayRevenueAmount = previousPaymentsData.reduce((sum, payment) => {
        const platformFeeAmount = payment.platform_fee || 0;
        const stripeFeeAmount = payment.stripe_fee || 0;
        const paymentRevenue = Math.max(0, platformFeeAmount - stripeFeeAmount);
        return sum + (paymentRevenue / 100); // Convert cents to pounds
      }, 0);
      
      console.log('Calculated clinipayRevenueAmount:', clinipayRevenueAmount);
      
      // Calculate trend percentages
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number(((current - previous) / previous * 100).toFixed(1));
      };
      
      const paymentsChange = calculatePercentageChange(totalPaymentsSum, previousTotalPaymentsSum);
      const revenueChange = calculatePercentageChange(clinipayRevenueAmount, previousClinicpayRevenueAmount);
      const refundsChange = calculatePercentageChange(totalRefundsSum, previousTotalRefundsSum);
      
      setStats({
        totalClinics: clinicsCount || 0,
        totalPayments: totalPaymentsSum,
        totalRefunds: totalRefundsSum,
        clinipayRevenue: clinipayRevenueAmount,
        paymentsChange: !isNaN(paymentsChange) ? paymentsChange : 0,
        revenueChange: !isNaN(revenueChange) ? revenueChange : 0,
        refundsChange: !isNaN(refundsChange) ? refundsChange : 0
      });
      
      console.log('Final stats set:', {
        totalClinics: clinicsCount || 0,
        totalPayments: totalPaymentsSum,
        totalRefunds: totalRefundsSum,
        clinipayRevenue: clinipayRevenueAmount,
        paymentsChange,
        revenueChange,
        refundsChange
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
