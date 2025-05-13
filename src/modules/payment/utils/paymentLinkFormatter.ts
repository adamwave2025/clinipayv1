
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
        title: link.title,
        description: link.description,
        amount: link.amount,
        status: link.status || (link.is_active ? 'active' : 'inactive'),
        isActive: isPaymentLinkActive(link),
        createdAt: link.created_at,
        expiresAt: link.expires_at,
        patientId: link.patient_id,
        patientName: link.patient_name || link.patients?.name,
        patientEmail: link.patient_email || link.patients?.email,
        paymentType: link.payment_type || link.type,
        paymentPlan: link.payment_plan || false,
        paymentFrequency: link.payment_frequency || link.payment_cycle,
        paymentCurrency: link.currency || 'GBP',
        clinicId: link.clinic_id,
        clinicName: link.clinic_name
      };
      
      // Handle installments if present
      if (link.installments) {
        formatted.installments = link.installments;
      }
      
      // Handle payment cycle data
      if (link.payment_cycle) {
        formatted.paymentCycle = link.payment_cycle;
      }
      
      // Handle remaining fields from raw data
      formatted.rawData = {
        ...link
      };
      
      return formatted;
    } catch (error) {
      console.error('Error formatting payment link:', error, link);
      // Return a minimal valid link to prevent errors
      return {
        id: link.id || 'unknown',
        title: link.title || 'Error loading link',
        amount: link.amount || 0,
        status: 'error',
        isActive: false,
        createdAt: link.created_at || new Date().toISOString(),
        paymentType: 'unknown',
        paymentCurrency: 'GBP'
      };
    }
  });
};
