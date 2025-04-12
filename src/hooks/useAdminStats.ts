
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformFee } from './useAdminSettings';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

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
      
      // Initialize query for payments data
      let paymentsQuery = supabase
        .from('payments')
        .select('amount_paid, status, refund_amount, net_amount, platform_fee, stripe_fee')
        .in('status', ['paid', 'partially_refunded', 'refunded']);
      
      // Initialize query for previous period payments data
      let previousPaymentsQuery = supabase
        .from('payments')
        .select('amount_paid, status, refund_amount, platform_fee, stripe_fee')
        .in('status', ['paid', 'partially_refunded', 'refunded']);
      
      // Apply date filters if dateRange is provided
      if (dateRange?.from && dateRange?.to) {
        // Create ISO strings for the dates to ensure proper formatting
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        
        // Set time for toDate to end of day
        toDate.setHours(23, 59, 59, 999);
        
        // Format dates as ISO strings for Supabase
        const fromDateISO = fromDate.toISOString();
        const toDateISO = toDate.toISOString();
        
        console.log('Filtering payments from', fromDateISO, 'to', toDateISO);
        
        // Apply current period filter using proper Supabase query methods
        paymentsQuery = paymentsQuery
          .gte('paid_at', fromDateISO)
          .lte('paid_at', toDateISO);
        
        // Calculate previous period with same duration
        const periodDurationMs = toDate.getTime() - fromDate.getTime();
        const previousFromDate = new Date(fromDate.getTime() - periodDurationMs);
        const previousToDate = new Date(fromDate.getTime() - 1); // 1ms before current period
        
        const previousFromDateISO = previousFromDate.toISOString();
        const previousToDateISO = previousToDate.toISOString();
        
        console.log('Previous period from', previousFromDateISO, 'to', previousToDateISO);
        
        // Apply previous period filter
        previousPaymentsQuery = previousPaymentsQuery
          .gte('paid_at', previousFromDateISO)
          .lte('paid_at', previousToDateISO);
      }
      
      // Execute the queries
      const { data: paymentsData, error: paymentsError } = await paymentsQuery;
      
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }
      
      const { data: previousPaymentsData, error: previousPaymentsError } = await previousPaymentsQuery;
      
      if (previousPaymentsError) {
        console.error('Error fetching previous payments:', previousPaymentsError);
        throw previousPaymentsError;
      }
      
      console.log('Retrieved payments data:', paymentsData?.length || 0, 'records');
      console.log('Retrieved previous period data:', previousPaymentsData?.length || 0, 'records');
      
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
      
      // Calculate CliniPay revenue
      let clinipayRevenueAmount = paymentsData.reduce((sum, payment) => {
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
      
      // Calculate trend percentages
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number(((current - previous) / previous * 100).toFixed(1));
      };
      
      const paymentsChange = calculatePercentageChange(totalPaymentsSum, previousTotalPaymentsSum);
      const revenueChange = calculatePercentageChange(clinipayRevenueAmount, previousClinicpayRevenueAmount);
      const refundsChange = calculatePercentageChange(totalRefundsSum, previousTotalRefundsSum);
      
      const updatedStats = {
        totalClinics: clinicsCount || 0,
        totalPayments: totalPaymentsSum,
        totalRefunds: totalRefundsSum,
        clinipayRevenue: clinipayRevenueAmount,
        paymentsChange: !isNaN(paymentsChange) ? paymentsChange : 0,
        revenueChange: !isNaN(revenueChange) ? revenueChange : 0,
        refundsChange: !isNaN(refundsChange) ? refundsChange : 0
      };
      
      console.log('Final stats calculated:', updatedStats);
      setStats(updatedStats);
      
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetchStats: fetchStats };
}
