
import { PaymentLinkData, RawClinicData } from '@/types/paymentLink';
import { ClinicFormatter } from './ClinicFormatter';

export const PaymentLinkFormatter = {
  formatPaymentRequest(requestData: any): PaymentLinkData | null {
    if (!requestData) return null;

    // Format clinic data from the request
    const clinicData = requestData.clinics as RawClinicData;

    // Handle cancelled status specifically
    const status = requestData.status === 'cancelled' ? 'cancelled' : requestData.status;

    // If it's a custom amount request
    if (requestData.custom_amount && !requestData.payment_link_id) {
      return {
        id: requestData.id,
        title: `Payment for ${requestData.patient_name}`,
        amount: requestData.custom_amount,
        type: 'custom',
        description: requestData.message || undefined,
        isRequest: true,
        customAmount: requestData.custom_amount,
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone,
        status: status,
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
        planTotalAmount: linkData.plan_total_amount || 0,
        totalPaid: requestData.total_paid || 0,
        totalOutstanding: (linkData.plan_total_amount || 0) - (requestData.total_paid || 0)
      } : {};
      
      return {
        id: requestData.id,
        title: linkData.title || `Payment for ${requestData.patient_name}`,
        amount: linkData.amount,
        type: linkData.type || 'other',
        description: linkData.description || requestData.message,
        isRequest: true,
        patientName: requestData.patient_name,
        patientEmail: requestData.patient_email,
        patientPhone: requestData.patient_phone,
        status: status,
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
      planTotalAmount: linkData.plan_total_amount || 0,
      totalPaid: linkData.total_paid || 0,
      totalOutstanding: (linkData.plan_total_amount || 0) - (linkData.total_paid || 0)
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
      amount: linkData.amount,
      type: linkData.type || 'other',
      description: linkData.description,
      status: status,
      clinic: ClinicFormatter.formatClinicData(clinicData),
      ...planData
    };
  }
};
