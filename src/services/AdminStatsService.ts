
import { supabase } from '@/integrations/supabase/client';
import { formatDateRangeForQuery } from '@/utils/adminStats';
import { DateRange } from 'react-day-picker';

/**
 * Fetches the total number of clinics from the database
 * excluding those associated with admin users
 */
export const fetchTotalClinics = async () => {
  // Query that excludes clinics associated with admin users
  const { count, error } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true })
    .not('id', 'in', (query) => {
      return query
        .from('users')
        .select('clinic_id')
        .eq('role', 'admin');
    });

  if (error) throw error;
  return count || 0;
};

/**
 * Fetches payment data for the specified date range
 */
export const fetchPaymentData = async (dateRange?: DateRange) => {
  // Initialize query for payments data
  let paymentsQuery = supabase
    .from('payments')
    .select('amount_paid, status, refund_amount, net_amount, platform_fee, stripe_fee')
    .in('status', ['paid', 'partially_refunded', 'refunded']);
  
  // Apply date filters if dateRange is provided
  const formattedDates = formatDateRangeForQuery(dateRange);
  if (formattedDates) {
    console.log('Filtering payments from', formattedDates.fromDateISO, 'to', formattedDates.toDateISO);
    
    // Apply current period filter using proper Supabase query methods
    paymentsQuery = paymentsQuery
      .gte('paid_at', formattedDates.fromDateISO)
      .lte('paid_at', formattedDates.toDateISO);
  }
  
  const { data, error } = await paymentsQuery;
  
  if (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Fetches payment data for the previous period
 */
export const fetchPreviousPeriodData = async (dateRange?: DateRange) => {
  // Initialize query for previous period payments data
  let previousPaymentsQuery = supabase
    .from('payments')
    .select('amount_paid, status, refund_amount, platform_fee, stripe_fee')
    .in('status', ['paid', 'partially_refunded', 'refunded']);
  
  // Apply date filters if dateRange is provided
  const formattedDates = formatDateRangeForQuery(dateRange);
  if (formattedDates) {
    // Calculate previous period with same duration
    const previousFromDate = new Date(new Date(dateRange.from).getTime() - formattedDates.periodDurationMs);
    const previousToDate = new Date(new Date(dateRange.from).getTime() - 1); // 1ms before current period
    
    const previousFromDateISO = previousFromDate.toISOString();
    const previousToDateISO = previousToDate.toISOString();
    
    console.log('Previous period from', previousFromDateISO, 'to', previousToDateISO);
    
    // Apply previous period filter
    previousPaymentsQuery = previousPaymentsQuery
      .gte('paid_at', previousFromDateISO)
      .lte('paid_at', previousToDateISO);
  }
  
  const { data, error } = await previousPaymentsQuery;
  
  if (error) {
    console.error('Error fetching previous payments:', error);
    throw error;
  }
  
  return data || [];
};
