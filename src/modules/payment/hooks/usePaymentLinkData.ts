
import { useState, useEffect } from 'react';
import { PaymentLinkData } from '../types/paymentLink';
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
        
        // Dummy function to simulate fetching data - in real implementation,
        // this would fetch from your backend/Supabase
        const fetchDummyData = async (): Promise<PaymentLinkData> => {
          // Return dummy data
          return {
            id: linkId,
            amount: 1000, // 10.00 in pence
            status: 'active',
            clinic: {
              id: 'clinic-123',
              name: 'Demo Clinic',
              email: 'contact@democlinic.com',
              phone: '+44123456789',
              address: '123 Medical St, London',
              logo: 'https://example.com/logo.png',
              stripeStatus: 'connected'
            },
            isRequest: false,
          };
        };

        const linkData = await fetchDummyData();
        
        // Validate the payment amount
        console.log('Payment amount in pence:', linkData.amount);
        if (!validatePenceAmount(linkData.amount, 'usePaymentLinkData')) {
          console.warn(`usePaymentLinkData: Payment amount validation failed: ${linkData.amount}`);
          
          // If the amount is 0, set it to 100 pence (£1) for testing
          if (linkData.amount === 0) {
            console.warn('usePaymentLinkData: Setting test amount of 100 pence (£1) for debugging');
            linkData.amount = 100;
          }
        }
        
        setLinkData(linkData);
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
