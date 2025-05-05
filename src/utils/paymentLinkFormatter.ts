
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
  // Improved handling for payment_plan boolean
  // First check for explicit boolean, then handle other cases
  const isPaymentPlan = link.payment_plan === true || link.payment_plan === 'true' || link.type === 'payment_plan';
  
  console.log(`Formatting payment link ${link.id}:`, {
    title: link.title,
    type: link.type,
    payment_plan_raw: link.payment_plan,
    payment_plan_type: typeof link.payment_plan,
    converted_payment_plan: isPaymentPlan,
    payment_count: link.payment_count,
    payment_cycle: link.payment_cycle,
    plan_total_amount: link.plan_total_amount
  });

  return {
    id: link.id,
    title: link.title || '',
    amount: link.amount || 0, // Keep the original amount from database (in cents)
    type: link.type || (isPaymentPlan ? 'payment_plan' : 'deposit'), // Default based on payment plan status
    description: link.description || '',
    url: `${window.location.origin}/payment/${link.id}`,
    createdAt: new Date(link.created_at).toLocaleDateString(),
    isActive: link.is_active !== false, // Default to active if not specified
    paymentPlan: isPaymentPlan, // Properly converted boolean value
    paymentCount: isPaymentPlan ? link.payment_count : undefined,
    paymentCycle: isPaymentPlan ? link.payment_cycle : undefined,
    planTotalAmount: isPaymentPlan ? link.plan_total_amount : undefined // Keep the original plan total amount (in cents)
  };
});
