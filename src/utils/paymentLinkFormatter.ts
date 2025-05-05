
import { PaymentLink } from '@/types/payment';

/**
 * Formats raw payment link data from the API into the PaymentLink interface format
 * 
 * NOTE: The database stores monetary values in cents (1/100 of currency unit)
 * So we need to divide by 100 when formatting amounts for display
 * 
 * This function also converts snake_case database field names to camelCase for frontend use
 * 
 * @param data - Raw payment link data from API
 * @returns Array of formatted PaymentLink objects
 */
export const formatPaymentLinks = (data: any[]): PaymentLink[] => data.map(link => {
  // Ensure payment_plan is properly converted to boolean
  const isPaymentPlan = link.payment_plan === true;

  return {
    id: link.id,
    title: link.title || '',
    amount: link.amount || 0, // Keep the original amount from database (in cents)
    type: link.type || 'payment_plan', // Default to payment_plan for plans
    description: link.description || '',
    url: `${window.location.origin}/payment/${link.id}`,
    createdAt: new Date(link.created_at).toLocaleDateString(),
    isActive: link.is_active,
    paymentPlan: isPaymentPlan, // Make sure this is a boolean
    paymentCount: isPaymentPlan ? link.payment_count : undefined,
    paymentCycle: isPaymentPlan ? link.payment_cycle : undefined,
    planTotalAmount: isPaymentPlan ? link.plan_total_amount : undefined // Keep the original plan total amount (in cents)
  };
});
