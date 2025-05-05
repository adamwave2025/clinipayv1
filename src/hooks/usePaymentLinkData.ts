
import { useState, useEffect } from 'react';
import { PaymentLinkData } from '@/types/paymentLink';
import { PaymentLinkService } from '@/services/PaymentLinkService';
import { PaymentLinkDataService } from '@/services/payment-link/PaymentLinkDataService';
import { PaymentLinkFormatter } from '@/services/payment-link/PaymentLinkFormatter';

export function usePaymentLinkData(linkId: string | undefined | null) {
  const [linkData, setLinkData] = useState<PaymentLinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkData = async () => {
      if (!linkId) {
        setIsLoading(false);
        setError('No payment link ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First, try to see if this is a payment request
        const requestData = await PaymentLinkDataService.fetchPaymentRequestWithClinic(linkId);
        
        // If we found a payment request
        if (requestData) {
          console.log('Found payment request:', requestData);
          // Format the request data before setting state
          const formattedRequestData = PaymentLinkFormatter.formatPaymentRequest(requestData);
          if (formattedRequestData) {
            setLinkData(formattedRequestData);
            setIsLoading(false);
            return;
          }
        }
        
        // If not a payment request, try to find as a regular payment link
        const linkData = await PaymentLinkDataService.fetchPaymentLinkWithClinic(linkId);

        if (!linkData) {
          throw new Error('Payment link not found');
        }

        // Format the link data before setting state
        const formattedLinkData = PaymentLinkFormatter.formatPaymentLink(linkData);
        if (!formattedLinkData) {
          throw new Error('Failed to format payment link data');
        }
        
        setLinkData(formattedLinkData);
      } catch (error: any) {
        console.error('Error fetching payment link/request:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkData();
  }, [linkId]);

  return {
    linkData,
    isLoading,
    error
  };
}

// Re-export the type for backwards compatibility
export type { PaymentLinkData } from '@/types/paymentLink';
