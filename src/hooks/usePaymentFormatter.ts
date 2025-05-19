import { Payment, PaymentLink } from '@/types/payment';
import { formatDate } from '@/utils/formatters';

export function usePaymentFormatter() {
  const formatCompletedPayments = (paymentsData: any[]): Payment[] => {
    return paymentsData.map(payment => {
      // Format the date correctly using our utility function
      const paidDate = payment.paid_at ? new Date(payment.paid_at) : new Date();
      
      // Determine the payment type - Use payment_type field if available
      let paymentType: Payment['type'] = payment.payment_type || 'consultation'; // First check direct field
      let linkTitle: string | undefined = payment.payment_title; // First check direct field
      let description: string | undefined = undefined;
      let paymentLinkId: string | undefined = undefined;
      
      // If direct payment_type isn't available, fall back to payment_links relationship data
      if (!paymentType && payment.payment_links) {
        console.log(`Using payment_links type: ${payment.payment_links.type}`);
        // Check if this is a payment plan first
        if (payment.payment_links.payment_plan === true) {
          paymentType = 'payment_plan';
        } else if (payment.payment_links.type) {
          const linkType = payment.payment_links.type;
          // Ensure type is one of the allowed values
          if (['deposit', 'treatment', 'consultation', 'other'].includes(linkType)) {
            paymentType = linkType as Payment['type'];
          }
        }
        
        if (!linkTitle && payment.payment_links.title) {
          linkTitle = payment.payment_links.title;
        }

        if (payment.payment_links.description) {
          description = payment.payment_links.description;
        }

        paymentLinkId = payment.payment_links.id;
      }
      
      console.log(`Final payment type determined for ${payment.id}: ${paymentType}`);
      
      // Calculate net amount if not provided
      const netAmount = payment.net_amount || (payment.amount_paid - (payment.platform_fee || 0));
      
      return {
        id: payment.id,
        clinicId: payment.clinic_id || '', // Add the required clinicId property
        patientName: payment.patient_name || 'Unknown Patient',
        patientEmail: payment.patient_email,
        patientPhone: payment.patient_phone || undefined,
        amount: payment.amount_paid || 0, // Raw amount in pence/cents - do NOT divide by 100
        platformFee: payment.platform_fee || 0, // Raw amount in pence/cents - do NOT divide by 100
        date: formatDate(paidDate),
        status: payment.status as any || 'paid',
        netAmount: netAmount, // Add the required netAmount property
        paymentMethod: payment.payment_method || 'card', // Add the required paymentMethod property
        type: paymentType,
        linkTitle,
        description,
        paymentLinkId,
        reference: payment.payment_ref || undefined,
        paymentReference: payment.payment_ref || undefined,
        manualPayment: payment.manual_payment || false,
        // Include refundedAmount for both partially_refunded and refunded statuses
        ...(payment.status === 'partially_refunded' && { refundedAmount: payment.refund_amount || 0 }),
        ...(payment.status === 'refunded' && { refundedAmount: payment.refund_amount || 0 }),
        stripePaymentId: payment.stripe_payment_id
      };
    });
  };

  const formatPaymentRequests = (requestsData: any[], paymentLinks: PaymentLink[]): Payment[] => {
    // Process all requests
    const allFormattedRequests = requestsData.map(request => {
      // Determine if this is a custom amount request
      const isCustomAmount = !!request.custom_amount && !request.payment_link_id;
      
      // Determine amount - either from custom amount or linked payment link
      let amount = 0;
      if (request.custom_amount) {
        amount = request.custom_amount; // Raw amount in pence/cents - do NOT divide by 100
      } else if (request.payment_link_id) {
        // Find the matching payment link to get its amount
        const paymentLink = paymentLinks.find(link => link.id === request.payment_link_id);
        if (paymentLink) {
          amount = paymentLink.amount; // Raw amount in pence/cents - do NOT divide by 100
        }
      }
      
      // Determine payment type and get link title and description
      let paymentType: Payment['type'] = 'other'; // Default fallback
      let linkTitle: string | undefined = undefined;
      let description: string | undefined = undefined;
      let paymentLinkId: string | undefined = request.payment_link_id;
      
      if (isCustomAmount) {
        // It's a custom payment request
        paymentType = 'other';
        linkTitle = 'Custom Payment Request';
      } else if (request.payment_links) {
        // Check if this is a payment plan first
        if (request.payment_links.payment_plan === true) {
          paymentType = 'payment_plan';
        }
        // It's a payment link-based request, use the link's type, title and description
        else if (request.payment_links.type) {
          const linkType = request.payment_links.type;
          if (['deposit', 'treatment', 'consultation', 'other'].includes(linkType)) {
            paymentType = linkType as Payment['type'];
          }
        }
        
        if (request.payment_links.title) {
          linkTitle = request.payment_links.title;
        }
        
        if (request.payment_links.description) {
          description = request.payment_links.description;
        }
      }
      
      // Ensure we have a valid date for sent_at
      const sentDate = request.sent_at ? new Date(request.sent_at) : new Date();
      
      // Fix: Construct payment URL without the extra '/request/' segment
      const paymentUrl = request.id 
        ? `${window.location.origin}/payment/${request.id}`
        : undefined;

      return {
        id: request.id,
        clinicId: request.clinic_id || '', // Add the required clinicId property
        patientName: request.patient_name || 'Unknown Patient',
        patientEmail: request.patient_email,
        patientPhone: request.patient_phone || undefined,
        amount, // Raw amount in pence/cents - do NOT divide by 100
        date: formatDate(sentDate),
        status: 'sent' as Payment['status'],  // Fix the type error by specifying the exact status
        netAmount: amount, // For requests, net amount is the same as amount
        paymentMethod: 'link', // Add the required paymentMethod property for requests
        type: paymentType,
        linkTitle,
        description,
        message: request.message,
        paymentUrl,
        isCustomAmount,
        paymentLinkId,
        reference: '', // Use a dash for unpaid payment requests
        paymentReference: '', // Use a dash for unpaid payment requests
        manualPayment: false // Requests are never manual payments
      };
    });
    
    // Filter out requests with zero amount
    return allFormattedRequests.filter(request => request.amount > 0);
  };

  const combineAndSortPayments = (completedPayments: Payment[], requestPayments: Payment[]): Payment[] => {
    // Combine both lists
    const allPayments = [...completedPayments, ...requestPayments];
    
    // Sort by date (newest first) - using actual Date objects for comparison
    allPayments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return allPayments;
  };

  return {
    formatCompletedPayments,
    formatPaymentRequests,
    combineAndSortPayments
  };
}
