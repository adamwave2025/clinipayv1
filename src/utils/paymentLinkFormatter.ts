
import { PaymentLink } from '@/types/payment';

/**
 * Formats raw payment link data from the API into the PaymentLink interface format
 * 
 * NOTE: The database stores monetary values in cents (1/100 of currency unit)
 * So we need to divide by 100 when formatting amounts for display
 * 
 * @param data - Raw payment link data from API
 * @returns Array of formatted PaymentLink objects
 */
export const formatPaymentLinks = (data: any[]): PaymentLink[] => data.map(link => ({
  id: link.id,
  title: link.title || '',
  amount: link.amount || 0, // Keep the original amount from database (in cents)
  type: link.type || 'other',
  description: link.description || '',
  url: `${window.location.origin}/payment/${link.id}`,
  createdAt: new Date(link.created_at).toLocaleDateString(),
  isActive: link.is_active,
  paymentPlan: link.payment_plan || false,
  paymentCount: link.payment_count,
  paymentCycle: link.payment_cycle,
  planTotalAmount: link.plan_total_amount // Keep the original plan total amount (in cents)
}));
