
import { useState, useEffect } from 'react';
import { PaymentLinkData } from '../types/paymentLink';
import { PaymentLinkService } from '../services/PaymentLinkService';
import { PaymentLinkDataService } from '@/services/payment-link/PaymentLinkDataService';
import { PaymentLinkFormatter } from '@/services/payment-link/PaymentLinkFormatter';
import { validatePenceAmount } from '../services/CurrencyService';

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
            
            // Log and validate the payment amount
            console.log('Payment amount in pence:', formattedRequestData.amount);
            if (!validatePenceAmount(formattedRequestData.amount, 'usePaymentLinkData')) {
              console.warn(`usePaymentLinkData: Payment amount validation failed: ${formattedRequestData.amount}`);
              
              // If the amount is 0, set it to 100 pence (£1) for testing
              // REMOVE THIS IN PRODUCTION - this is just for debugging
              if (formattedRequestData.amount === 0) {
                console.warn('usePaymentLinkData: Setting test amount of 100 pence (£1) for debugging');
                formattedRequestData.amount = 100;
              }
            }
            
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
        
        // Log and validate the payment amount
        console.log('Payment amount in pence:', formattedLinkData.amount);
        if (!validatePenceAmount(formattedLinkData.amount, 'usePaymentLinkData')) {
          console.warn(`usePaymentLinkData: Payment amount validation failed: ${formattedLinkData.amount}`);
          
          // If the amount is 0, set it to 100 pence (£1) for testing
          // REMOVE THIS IN PRODUCTION - this is just for debugging
          if (formattedLinkData.amount === 0) {
            console.warn('usePaymentLinkData: Setting test amount of 100 pence (£1) for debugging');
            formattedLinkData.amount = 100;
          }
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
export type { PaymentLinkData } from '../types/paymentLink';
