
import { PaymentLinkData, RawClinicData } from '@/types/paymentLink';
import { ClinicFormatter } from './ClinicFormatter';

/**
 * PaymentLinkFormatter
 * 
 * NOTE: The database stores monetary values in cents (1/100 of currency unit)
 * So we consistently divide by 100 when formatting amounts for display
 */
export const PaymentLinkFormatter = {
  formatPaymentRequest(requestData: any): PaymentLinkData | null {
    if (!requestData) return null;

    // Format clinic data from the request
    const clinicData = requestData.clinics as RawClinicData;

    // Handle cancelled status specifically
    const status = requestData.status === 'cancelled' ? 'cancelled' : requestData.status;

    // Check if this payment has been paid
    const paymentId = requestData.payment_id;
    const isPaid = status === 'paid' || !!paymentId;
    
    // If it's a custom amount request
    if (requestData.custom_amount && !requestData.payment_link_id) {
      return {
        id: requestData.id,
        title: `Payment for ${requestData.patient_name}`,
        amount: requestData.custom_amount / 100, // Convert cents to standard currency units
        type: 'custom',
        description: requestData.message || undefined,
        isRequest: true,
        customAmount: requestData.custom_amount / 100, // Convert cents to standard currency units
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone,
        status: status,
        paymentId: paymentId,
        clinic: ClinicFormatter.formatClinicData(clinicData)
      };
    }

    // If it's a payment link-based request
    if (requestData.payment_links) {
      const linkData = requestData.payment_links;
      
      // Extract payment plan data if available
      const paymentPlan = linkData.payment_plan || false;
      const planData = paymentPlan ? {
        paymentPlan: true,
        planTotalAmount: (linkData.plan_total_amount || 0) / 100, // Convert cents to standard currency units
        totalPaid: (requestData.total_paid || 0) / 100, // Convert cents to standard currency units
        totalOutstanding: (linkData.plan_total_amount || 0 - (requestData.total_paid || 0)) / 100 // Convert cents to standard currency units
      } : {};
      
      return {
        id: requestData.id,
        title: linkData.title || `Payment for ${requestData.patient_name}`,
        amount: (linkData.amount || 0) / 100, // Convert cents to standard currency units
        type: linkData.type || 'other',
        description: linkData.description || requestData.message,
        isRequest: true,
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone,
        status: status,
        paymentId: paymentId,
        clinic: ClinicFormatter.formatClinicData(clinicData),
        ...planData
      };
    }

    return null;
  },

  formatPaymentLink(linkData: any): PaymentLinkData | null {
    if (!linkData) return null;

    // Format clinic data from the link
    const clinicData = linkData.clinics as RawClinicData;
    
    // Extract payment plan data if available
    const paymentPlan = linkData.payment_plan || false;
    const planData = paymentPlan ? {
      paymentPlan: true,
      planTotalAmount: (linkData.plan_total_amount || 0) / 100, // Convert cents to standard currency units
      totalPaid: (linkData.total_paid || 0) / 100, // Convert cents to standard currency units
      totalOutstanding: ((linkData.plan_total_amount || 0) - (linkData.total_paid || 0)) / 100 // Convert cents to standard currency units
    } : {};

    // Handle link status specifically
    let status = linkData.status;
    
    // If status isn't explicitly set, derive from is_active
    if (!status) {
      status = linkData.is_active === false ? 'inactive' : 'active';
    }

    return {
      id: linkData.id,
      title: linkData.title || 'Payment',
      amount: (linkData.amount || 0) / 100, // Convert cents to standard currency units
      type: linkData.type || 'other',
      description: linkData.description,
      status: status,
      isRequest: false, // Add the missing isRequest property
      clinic: ClinicFormatter.formatClinicData(clinicData),
      ...planData
    };
  }
};
