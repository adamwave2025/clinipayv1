import { Payment, PaymentLink } from '@/types/payment';
import { formatDate } from '@/utils/formatters';

export function usePaymentFormatter() {
  const formatCompletedPayments = (paymentsData: any[]): Payment[] => {
    return paymentsData.map(payment => {
      // Format the date correctly using our utility function
      const paidDate = payment.paid_at ? new Date(payment.paid_at) : new Date();
      
      // Determine the payment type
      let paymentType: Payment['type'] = 'consultation'; // Default type
      let linkTitle: string | undefined = undefined;
      let description: string | undefined = undefined;
      let paymentLinkId: string | undefined = undefined;
      
      // If linked to a payment link, use that type and title
      if (payment.payment_links) {
        if (payment.payment_links.type) {
          const linkType = payment.payment_links.type;
          // Ensure type is one of the allowed values
          if (['deposit', 'treatment', 'consultation', 'other'].includes(linkType)) {
            paymentType = linkType as Payment['type'];
          }
        }
        
        if (payment.payment_links.title) {
          linkTitle = payment.payment_links.title;
        }

        if (payment.payment_links.description) {
          description = payment.payment_links.description;
        }

        paymentLinkId = payment.payment_links.id;
      }
      
      return {
        id: payment.id,
        patientName: payment.patient_name || 'Unknown Patient',
        patientEmail: payment.patient_email,
        patientPhone: payment.patient_phone || undefined,
        amount: payment.amount_paid || 0,
        platformFee: payment.platform_fee || 0, // Include the platform fee
        date: formatDate(paidDate),
        status: payment.status as any || 'paid',
        type: paymentType,
        linkTitle,
        description,
        paymentLinkId,
        reference: payment.payment_ref || undefined,
        // Include refundedAmount for both partially_refunded and refunded statuses
        ...(payment.status === 'partially_refunded' && { refundedAmount: payment.refund_amount || 0 }),
        ...(payment.status === 'refunded' && { refundedAmount: payment.refund_amount || 0 })
      };
    });
  };

  const formatPaymentRequests = (requestsData: any[], paymentLinks: PaymentLink[]): Payment[] => {
    return requestsData.map(request => {
      // Determine if this is a custom amount request
      const isCustomAmount = !!request.custom_amount && !request.payment_link_id;
      
      // Determine amount - either from custom amount or linked payment link
      let amount = 0;
      if (request.custom_amount) {
        amount = request.custom_amount;
      } else if (request.payment_link_id) {
        // Find the matching payment link to get its amount
        const paymentLink = paymentLinks.find(link => link.id === request.payment_link_id);
        if (paymentLink) {
          amount = paymentLink.amount;
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
        // It's a payment link-based request, use the link's type, title and description
        if (request.payment_links.type) {
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
        patientName: request.patient_name || 'Unknown Patient',
        patientEmail: request.patient_email,
        patientPhone: request.patient_phone || undefined,
        amount,
        date: formatDate(sentDate),
        status: 'sent',
        type: paymentType,
        linkTitle,
        description,
        message: request.message,
        paymentUrl,
        isCustomAmount,
        paymentLinkId
      };
    });
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
