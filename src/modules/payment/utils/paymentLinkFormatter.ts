
/**
 * Utility functions for formatting payment links
 */
import { PaymentLink } from '../types/payment';
import { isPaymentLinkActive } from './planActivityUtils';

/**
 * Format payment links from API response
 */
export const formatPaymentLinks = (links: any[]): PaymentLink[] => {
  if (!links || !Array.isArray(links)) {
    console.warn('Invalid links data provided to formatPaymentLinks:', links);
    return [];
  }
  
  return links.map(link => {
    try {
      const formatted: PaymentLink = {
        id: link.id,
        title: link.title || '',
        amount: link.amount || 0,
        type: link.payment_type || link.type || 'deposit', // Default to 'deposit' if type is missing
        description: link.description || '',
        url: link.url,
        createdAt: link.created_at,
        isActive: isPaymentLinkActive(link),
        paymentPlan: link.payment_plan || false,
        paymentCycle: link.payment_cycle || link.payment_frequency,
        paymentCount: link.payment_count,
        planTotalAmount: link.plan_total_amount
      };
      
      return formatted;
    } catch (error) {
      console.error('Error formatting payment link:', error, link);
      // Return a minimal valid link to prevent errors - with all required fields
      return {
        id: link.id || 'unknown',
        title: link.title || 'Error loading link',
        amount: link.amount || 0,
        type: 'deposit', // Ensure type is always provided as it's required
        description: '',
        createdAt: link.created_at
      };
    }
  });
};
