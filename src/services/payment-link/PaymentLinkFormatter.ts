
import { PaymentLinkData } from '@/types/paymentLink';
import { formatCurrency } from '@/utils/formatters';

export class PaymentLinkFormatter {
  /**
   * Format a payment link from the database into a standardized format
   * @param linkData Raw payment link data from the database
   * @returns Formatted payment link data
   */
  static formatPaymentLink(linkData: any): PaymentLinkData | null {
    if (!linkData) return null;

    // Extract clinic data
    const clinic = {
      id: linkData.clinic_id || linkData.clinics?.id || '',
      name: linkData.clinics?.clinic_name || 'Unknown Clinic',
      logo: linkData.clinics?.logo_url || '',
      email: linkData.clinics?.email || '',
      phone: linkData.clinics?.phone || '',
      address: this.formatAddress(linkData.clinics),
      stripeStatus: linkData.clinics?.stripe_status || 'not_connected'
    };

    // Determine the status based on is_active and existing status
    let status = this.formatPaymentStatus(linkData.status) || 'active';
    
    // If is_active is explicitly false, override the status to cancelled
    const isActive = linkData.is_active !== false; // Consider undefined as active
    if (!isActive) {
      status = 'cancelled';
      console.log(`PaymentLinkFormatter: Link ${linkData.id} marked as cancelled due to is_active=false`);
    }

    console.log(`PaymentLinkFormatter: Link ${linkData.id} status calculation:`, {
      rawStatus: linkData.status,
      isActive: isActive,
      finalStatus: status
    });

    // Format the payment link data
    return {
      id: linkData.id,
      title: linkData.title || 'Payment',
      type: linkData.type || 'one_time',
      amount: linkData.amount || 0,
      description: linkData.description || '',
      clinic: clinic,
      status: status,
      isActive: isActive, // Add the original is_active value for reference
      isRequest: false,
      paymentPlan: linkData.payment_plan || false,
      planTotalAmount: linkData.plan_total_amount || linkData.amount,
      customAmount: linkData.custom_amount || null,
      isRescheduled: linkData.status === 'rescheduled'
    };
  }

  /**
   * Format a payment request from the database into a standardized format
   * @param requestData Raw payment request data from the database
   * @returns Formatted payment request data
   */
  static formatPaymentRequest(requestData: any): PaymentLinkData | null {
    if (!requestData) return null;

    // Extract clinic data
    const clinic = {
      id: requestData.clinic_id || requestData.clinics?.id || '',
      name: requestData.clinics?.clinic_name || 'Unknown Clinic',
      logo: requestData.clinics?.logo_url || '',
      email: requestData.clinics?.email || '',
      phone: requestData.clinics?.phone || '',
      address: this.formatAddress(requestData.clinics),
      stripeStatus: requestData.clinics?.stripe_status || 'not_connected'
    };

    // Get the amount - use custom_amount if available, otherwise use the payment link amount
    const amount = requestData.custom_amount || 
                  (requestData.payment_links?.amount) || 
                  0;

    // Determine status based on request status and payment link status
    let status = this.formatPaymentStatus(requestData.status) || 'active';
    
    // For payment requests, if they're associated with an inactive link, also mark as cancelled
    const linkedLinkIsActive = requestData.payment_links?.is_active !== false;
    const isActive = linkedLinkIsActive && (status !== 'cancelled'); // Request is active if both link is active and status isn't cancelled
    
    if (!linkedLinkIsActive) {
      status = 'cancelled';
      console.log(`PaymentLinkFormatter: Request ${requestData.id} marked as cancelled due to inactive payment link`);
    }

    console.log(`PaymentLinkFormatter: Request ${requestData.id} status calculation:`, {
      rawStatus: requestData.status, 
      linkedLinkIsActive,
      finalStatus: status
    });

    // Format the payment request data
    return {
      id: requestData.id,
      title: requestData.payment_links?.title || 'Payment Request',
      type: requestData.payment_links?.type || 'one_time',
      amount: amount,
      description: requestData.payment_links?.description || '',
      clinic: clinic,
      status: status,
      isActive: isActive, // Add the isActive flag
      isRequest: true,
      patientName: requestData.patient_name || '',
      patientEmail: requestData.patient_email || '',
      patientPhone: requestData.patient_phone || '',
      paymentId: requestData.payment_id || null,
      customAmount: requestData.custom_amount || null,
      payment_link_id: requestData.payment_link_id || null,
      isRescheduled: requestData.status === 'rescheduled'
    };
  }

  /**
   * Format a payment plan from the database into a standardized format
   * @param planData Raw payment plan data from the database
   * @returns Formatted payment plan data
   */
  static formatPaymentPlan(planData: any): PaymentLinkData | null {
    if (!planData) return null;

    // Extract clinic data
    const clinic = {
      id: planData.clinic_id || planData.clinics?.id || '',
      name: planData.clinics?.clinic_name || 'Unknown Clinic',
      logo: planData.clinics?.logo_url || '',
      email: planData.clinics?.email || '',
      phone: planData.clinics?.phone || '',
      address: this.formatAddress(planData.clinics),
      stripeStatus: planData.clinics?.stripe_status || 'not_connected'
    };

    // Calculate total paid and outstanding amounts
    const totalAmount = planData.total_amount || 0;
    const totalPaid = planData.total_paid || 0;
    const totalOutstanding = totalAmount - totalPaid;

    // Determine status and active state
    let status = this.formatPaymentStatus(planData.status);
    
    // For payment plans, also check the associated link's active state
    const linkedLinkIsActive = planData.payment_links?.is_active !== false;
    const isActive = linkedLinkIsActive && ['active', 'overdue'].includes(status);
    
    if (!linkedLinkIsActive) {
      console.log(`PaymentLinkFormatter: Plan ${planData.id} associated with inactive payment link`);
    }

    console.log(`PaymentLinkFormatter: Plan ${planData.id} status calculation:`, {
      rawStatus: planData.status, 
      linkedLinkIsActive,
      finalStatus: status,
      isActive
    });

    // Format the payment plan data
    return {
      id: planData.id,
      title: planData.title || planData.payment_links?.title || 'Payment Plan',
      type: 'payment_plan',
      amount: planData.next_payment_amount || 0,
      description: planData.description || planData.payment_links?.description || '',
      clinic: clinic,
      status: status,
      isActive: isActive, // Add the isActive flag
      isRequest: false,
      paymentPlan: true,
      planTotalAmount: totalAmount,
      totalPaid: totalPaid,
      totalOutstanding: totalOutstanding,
      hasOverduePayments: planData.has_overdue_payments || false,
      payment_link_id: planData.payment_link_id || null,
      isRescheduled: planData.status === 'rescheduled'
    };
  }

  /**
   * Format an address from clinic data
   * @param clinicData Raw clinic data
   * @returns Formatted address string
   */
  private static formatAddress(clinicData: any): string {
    if (!clinicData) return '';

    const addressParts = [];
    
    if (clinicData.address_line_1) addressParts.push(clinicData.address_line_1);
    if (clinicData.address_line_2) addressParts.push(clinicData.address_line_2);
    if (clinicData.city) addressParts.push(clinicData.city);
    if (clinicData.postcode) addressParts.push(clinicData.postcode);
    
    return addressParts.join(', ');
  }

  /**
   * Format a payment status to ensure it's valid
   * @param status Raw status string
   * @returns Normalized status string
   */
  static formatPaymentStatus(status: string | null): string {
    if (!status) return 'pending';
    
    // Normalize the status to lowercase for consistent comparison
    const normalizedStatus = status.toLowerCase();
    
    // List of valid statuses
    const validStatuses = [
      'pending',
      'sent',
      'paid',
      'cancelled',
      'overdue',
      'paused',
      'rescheduled',
      'completed',
      'active'
    ];
    
    // Check if the status is valid
    if (validStatuses.includes(normalizedStatus)) {
      return normalizedStatus;
    }
    
    // Default status if not recognized
    console.warn(`Unknown payment status: ${status}, defaulting to 'pending'`);
    return 'pending';
  }

  /**
   * Format a payment amount for display
   * @param amount Amount in pence/cents
   * @returns Formatted currency string
   */
  static formatAmount(amount: number): string {
    return formatCurrency(amount);
  }
}
