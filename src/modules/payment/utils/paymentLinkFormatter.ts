
import { PaymentLink } from '../types/paymentLink';

export const formatPaymentLinks = (rawLinks: any[]): PaymentLink[] => {
  if (!Array.isArray(rawLinks)) {
    console.error('formatPaymentLinks received non-array input:', rawLinks);
    return [];
  }
  
  try {
    return rawLinks.map(link => {
      // Check if this is a payment plan
      const isPaymentPlan = Boolean(link.payment_plan);
      
      // Format the raw link data into our PaymentLink type
      return {
        id: link.id,
        title: link.title || '',
        description: link.description || '',
        amount: link.amount,
        type: link.type || 'standard',
        clinic_id: link.clinic_id,
        is_active: link.is_active !== false,
        created_at: link.created_at ? new Date(link.created_at).toISOString() : new Date().toISOString(),
        payment_plan: isPaymentPlan,
        payment_count: isPaymentPlan ? link.payment_count : undefined,
        payment_cycle: isPaymentPlan ? link.payment_cycle : undefined,
        plan_total_amount: isPaymentPlan ? link.plan_total_amount : undefined
      };
    });
  } catch (error) {
    console.error('Error formatting payment links:', error);
    return [];
  }
};
