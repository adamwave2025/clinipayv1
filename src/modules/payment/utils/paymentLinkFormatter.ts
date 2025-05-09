
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
        title: link.title,
        description: link.description || '',
        amount: link.amount,
        status: link.status || 'active',
        createdAt: new Date(link.created_at),
        clinicId: link.clinic_id,
        paymentPlan: isPaymentPlan,
        planDetails: isPaymentPlan ? {
          totalAmount: link.payment_plan?.total_amount || 0,
          initialPayment: link.payment_plan?.initial_payment || 0,
          numberOfPayments: link.payment_plan?.number_of_payments || 0,
          frequency: link.payment_plan?.frequency || 'monthly'
        } : null
      };
    });
  } catch (error) {
    console.error('Error formatting payment links:', error);
    return [];
  }
};
