
import { PaymentLink } from '../types/payment';

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
        status: link.status || 'active',
        createdAt: link.created_at ? new Date(link.created_at).toISOString() : undefined,
        isActive: link.is_active !== false,
        paymentPlan: isPaymentPlan,
        paymentCount: isPaymentPlan ? link.payment_plan?.number_of_payments : undefined,
        paymentCycle: isPaymentPlan ? link.payment_plan?.frequency : undefined,
        planTotalAmount: isPaymentPlan ? link.payment_plan?.total_amount : undefined
      };
    });
  } catch (error) {
    console.error('Error formatting payment links:', error);
    return [];
  }
};
