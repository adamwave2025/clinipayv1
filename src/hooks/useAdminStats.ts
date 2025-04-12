
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { usePlatformFee } from './useAdminSettings';
import { 
  calculatePercentageChange, 
  calculateTotalPayments, 
  calculateTotalRefunds, 
  calculateClinicpayRevenue 
} from '@/utils/adminStats';
import { fetchTotalClinics, fetchPaymentData, fetchPreviousPeriodData } from '@/services/AdminStatsService';
import { AdminStats, defaultStats } from '@/types/adminStats';

// Change this line to use "export type" instead of just "export"
export type { AdminStats };

export function useAdminStats(dateRange?: DateRange) {
  const [stats, setStats] = useState<AdminStats>(defaultStats);
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
      const clinicsCount = await fetchTotalClinics();
      
      // Fetch payment data for current period
      const paymentsData = await fetchPaymentData(dateRange);
      console.log('Retrieved payments data:', paymentsData?.length || 0, 'records');
      
      // Fetch payment data for previous period
      const previousPaymentsData = await fetchPreviousPeriodData(dateRange);
      console.log('Retrieved previous period data:', previousPaymentsData?.length || 0, 'records');
      
      // Calculate total payments
      const totalPaymentsSum = calculateTotalPayments(paymentsData);
      const previousTotalPaymentsSum = calculateTotalPayments(previousPaymentsData);
      
      // Calculate total refunds
      const totalRefundsSum = calculateTotalRefunds(paymentsData);
      const previousTotalRefundsSum = calculateTotalRefunds(previousPaymentsData);
      
      // Calculate CliniPay revenue
      const clinipayRevenueAmount = calculateClinicpayRevenue(paymentsData);
      const previousClinicpayRevenueAmount = calculateClinicpayRevenue(previousPaymentsData);
      
      // Calculate trend percentages
      const paymentsChange = calculatePercentageChange(totalPaymentsSum, previousTotalPaymentsSum);
      const revenueChange = calculatePercentageChange(clinipayRevenueAmount, previousClinicpayRevenueAmount);
      const refundsChange = calculatePercentageChange(totalRefundsSum, previousTotalRefundsSum);
      
      const updatedStats = {
        totalClinics: clinicsCount,
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
