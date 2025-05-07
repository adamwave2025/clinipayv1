
import { PaymentLink } from '@/types/payment';

/**
 * Formats raw payment link data from the API into the PaymentLink interface format
 * 
 * NOTE: The database stores monetary values in cents (1/100 of currency unit)
 * Do NOT divide by 100 here - let the formatCurrency utility handle the conversion
 * 
 * This function also converts snake_case database field names to camelCase for frontend use
 * 
 * @param data - Raw payment link data from API
 * @returns Array of formatted PaymentLink objects
 */
export const formatPaymentLinks = (data: any[]): PaymentLink[] => {
  console.log(`Formatting ${data.length} payment links`);
  
  return data.map(link => {
    // First check if this is definitively a payment plan based on multiple data points
    const isPaymentPlan = 
      link.payment_plan === true || 
      link.type === 'payment_plan' || 
      (link.payment_count && link.payment_cycle);
    
    // Debug each link's payment plan status
    console.log(`Link ${link.id}: ${link.title}`, {
      type: link.type,
      payment_plan_raw: link.payment_plan,
      payment_plan_type: typeof link.payment_plan,
      payment_count: link.payment_count,
      payment_cycle: link.payment_cycle,
      is_payment_plan: isPaymentPlan
    });

    return {
      id: link.id,
      title: link.title || '',
      amount: link.amount || 0, // Raw amount in cents (do NOT divide by 100)
      type: link.type || (isPaymentPlan ? 'payment_plan' : 'deposit'), // Default based on payment plan status
      description: link.description || '',
      url: `${window.location.origin}/payment/${link.id}`,
      createdAt: new Date(link.created_at).toLocaleDateString(),
      isActive: link.is_active !== false, // Default to active if not specified
      paymentPlan: isPaymentPlan, // Now a properly calculated boolean value
      paymentCount: isPaymentPlan ? link.payment_count : undefined,
      paymentCycle: isPaymentPlan ? link.payment_cycle : undefined,
      planTotalAmount: isPaymentPlan ? link.plan_total_amount : undefined // Raw amount in cents (do NOT divide by 100)
    };
  });
};
