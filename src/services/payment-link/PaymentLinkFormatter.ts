
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
        // FIXED: Make sure the amount is properly converted from cents
        amount: Number.isInteger(requestData.custom_amount) && requestData.custom_amount >= 100 ? 
               requestData.custom_amount / 100 : requestData.custom_amount,
        type: 'custom',
        description: requestData.message || undefined,
        isRequest: true,
        // FIXED: Same conversion for the customAmount
        customAmount: Number.isInteger(requestData.custom_amount) && requestData.custom_amount >= 100 ? 
                    requestData.custom_amount / 100 : requestData.custom_amount,
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
      let planData = {};
      
      if (paymentPlan) {
        // Get total paid amount either from our query or default to 0
        // Use total_paid_amount instead of total_paid
        // FIXED: Proper cents to currency conversion
        const totalPaid = Number.isInteger(requestData.total_paid_amount) && requestData.total_paid_amount >= 100 ? 
                         requestData.total_paid_amount / 100 : (requestData.total_paid_amount || 0);
        
        const planTotalAmount = Number.isInteger(linkData.plan_total_amount) && linkData.plan_total_amount >= 100 ? 
                              linkData.plan_total_amount / 100 : (linkData.plan_total_amount || 0);
        
        const totalOutstanding = Math.max(0, planTotalAmount - totalPaid); // Ensure we don't have negative outstanding
        
        console.log(`PaymentLinkFormatter: Plan data - Total: ${planTotalAmount}, Paid: ${totalPaid}, Outstanding: ${totalOutstanding}`);
        
        planData = {
          paymentPlan: true,
          planTotalAmount: planTotalAmount,
          totalPaid: totalPaid,
          totalOutstanding: totalOutstanding,
          payment_link_id: requestData.payment_link_id // Include the payment_link_id for payment plans
        };
      }
      
      return {
        id: requestData.id,
        title: linkData.title || `Payment for ${requestData.patient_name}`,
        // FIXED: Proper cents to currency conversion
        amount: Number.isInteger(linkData.amount) && linkData.amount >= 100 ? 
               linkData.amount / 100 : (linkData.amount || 0),
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
    let planData = {};
    
    if (paymentPlan) {
      // Get total paid amount either from our query or default to 0
      // FIXED: Proper cents to currency conversion
      const totalPaid = Number.isInteger(linkData.total_paid_amount) && linkData.total_paid_amount >= 100 ? 
                       linkData.total_paid_amount / 100 : (linkData.total_paid_amount || 0);
      
      const planTotalAmount = Number.isInteger(linkData.plan_total_amount) && linkData.plan_total_amount >= 100 ? 
                            linkData.plan_total_amount / 100 : (linkData.plan_total_amount || 0);
      
      const totalOutstanding = Math.max(0, planTotalAmount - totalPaid); // Ensure we don't have negative outstanding
      
      console.log(`PaymentLinkFormatter: Plan data - Total: ${planTotalAmount}, Paid: ${totalPaid}, Outstanding: ${totalOutstanding}`);
      
      planData = {
        paymentPlan: true,
        planTotalAmount: planTotalAmount,
        totalPaid: totalPaid,
        totalOutstanding: totalOutstanding,
        payment_link_id: linkData.id // Use the link's own ID as the payment_link_id
      };
    }

    // Handle link status specifically
    let status = linkData.status;
    
    // If status isn't explicitly set, derive from is_active
    if (!status) {
      status = linkData.is_active === false ? 'inactive' : 'active';
    }

    return {
      id: linkData.id,
      title: linkData.title || 'Payment',
      // FIXED: Proper cents to currency conversion
      amount: Number.isInteger(linkData.amount) && linkData.amount >= 100 ? 
             linkData.amount / 100 : (linkData.amount || 0),
      type: linkData.type || 'other',
      description: linkData.description,
      status: status,
      isRequest: false, // Add the missing isRequest property
      clinic: ClinicFormatter.formatClinicData(clinicData),
      ...planData
    };
  }
};
