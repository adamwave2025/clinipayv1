import { DateRange } from "react-day-picker";

/**
 * Formats dates for use in Supabase queries, ensuring proper time settings
 */
export const formatDateRangeForQuery = (dateRange?: DateRange) => {
  if (!dateRange?.from || !dateRange?.to) {
    return null;
  }

  // Create ISO strings for the dates to ensure proper formatting
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  
  // Set time for toDate to end of day
  toDate.setHours(23, 59, 59, 999);
  
  // Format dates as ISO strings for Supabase
  return {
    fromDateISO: fromDate.toISOString(),
    toDateISO: toDate.toISOString(),
    periodDurationMs: toDate.getTime() - fromDate.getTime()
  };
};

/**
 * Calculates percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
};

/**
 * Calculates total payments amount from payment data
 */
export const calculateTotalPayments = (paymentsData: any[]) => {
  return paymentsData.reduce((sum, payment) => {
    if (payment.status === 'paid') {
      return sum + (payment.amount_paid || 0);
    } else if (payment.status === 'partially_refunded') {
      // For partially refunded payments, subtract the refunded amount
      const remainingAmount = (payment.amount_paid || 0) - (payment.refund_amount || 0);
      return sum + Math.max(0, remainingAmount); // Ensure we don't add negative values
    }
    return sum;
  }, 0);
};

/**
 * Calculates total refunds amount from payment data
 */
export const calculateTotalRefunds = (paymentsData: any[]) => {
  return paymentsData.reduce((sum, payment) => {
    if (payment.status === 'refunded') {
      return sum + (payment.amount_paid || 0);
    } else if (payment.status === 'partially_refunded') {
      return sum + (payment.refund_amount || 0);
    }
    return sum;
  }, 0);
};

/**
 * Calculates CliniPay revenue from payment data using a simple formula
 */
export const calculateClinicpayRevenue = (paymentsData: any[]) => {
  return paymentsData.reduce((sum, payment) => {
    const platformFeeAmount = payment.platform_fee || 0;
    const stripeFeeAmount = payment.stripe_fee || 0;
    const stripeRefundFeeAmount = payment.stripe_refund_fee || 0;
    
    // Simple calculation: Platform Fee - Stripe Fee - Stripe Refund Fee
    const paymentRevenue = platformFeeAmount - stripeFeeAmount - stripeRefundFeeAmount;
    
    return sum + (paymentRevenue / 100); // Convert cents to pounds
  }, 0);
};
