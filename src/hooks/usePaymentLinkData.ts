
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
        console.log('usePaymentLinkData: No payment link ID provided');
        setIsLoading(false);
        setError('No payment link ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`usePaymentLinkData: Fetching data for link ID: ${linkId}`);
        
        // First, try to see if this is a payment request
        const requestData = await PaymentLinkDataService.fetchPaymentRequestWithClinic(linkId);
        
        // If we found a payment request
        if (requestData) {
          console.log('usePaymentLinkData: Found payment request:', requestData);
          // Format the request data before setting state
          const formattedRequestData = PaymentLinkFormatter.formatPaymentRequest(requestData);
          if (formattedRequestData) {
            console.log('usePaymentLinkData: Successfully formatted payment request data');
            setLinkData(formattedRequestData);
            setIsLoading(false);
            return;
          } else {
            console.error('usePaymentLinkData: Failed to format payment request data');
          }
        } else {
          console.log(`usePaymentLinkData: No payment request found for ID ${linkId}, trying payment link`);
        }
        
        // If not a payment request, try to find as a regular payment link
        const linkData = await PaymentLinkDataService.fetchPaymentLinkWithClinic(linkId);

        if (!linkData) {
          console.error(`usePaymentLinkData: Payment link not found for ID ${linkId}`);
          throw new Error('Payment link not found');
        }

        console.log('usePaymentLinkData: Found payment link:', linkData);
        
        // Format the link data before setting state
        const formattedLinkData = PaymentLinkFormatter.formatPaymentLink(linkData);
        if (!formattedLinkData) {
          console.error('usePaymentLinkData: Failed to format payment link data');
          throw new Error('Failed to format payment link data');
        }
        
        console.log('usePaymentLinkData: Successfully formatted payment link data');
        setLinkData(formattedLinkData);
      } catch (error: any) {
        console.error('usePaymentLinkData: Error fetching payment link/request:', error);
        setError(error.message || 'An error occurred while fetching payment information');
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
