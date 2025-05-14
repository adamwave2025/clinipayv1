
import { PaymentLink, ProcessedPaymentLink } from '../types/paymentLink';

/**
 * Format raw payment link data from the database into a more usable format
 * @param links Raw payment link data from database
 * @returns Formatted payment links
 */
export const formatPaymentLinks = (links: any[]): ProcessedPaymentLink[] => {
  return links.map((link) => {
    return {
      id: link.id,
      clinic_id: link.clinic_id,
      title: link.title,
      description: link.description,
      amount: link.amount,
      type: link.type,
      status: link.status,
      createdAt: link.created_at ? new Date(link.created_at).toISOString() : new Date().toISOString(),
      isActive: link.is_active !== false,
      paymentPlan: link.payment_plan || false,
      paymentCount: link.payment_count,
      paymentCycle: link.payment_cycle,
      planTotalAmount: link.plan_total_amount
    };
  });
};
