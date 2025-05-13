
import { useState, useEffect } from 'react';
import { PaymentLinkData } from '../types/paymentLink';
import { validatePenceAmount } from '../services/CurrencyService';
import { isPaymentLinkActive } from '../utils/planActivityUtils';

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
        
        // Fetch actual payment link data from your API
        // This is a simplified example, replace with your actual API call
        const response = await fetch(`/api/payment-links/${linkId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch payment link data');
        }
        
        const rawLinkData = await response.json();
        console.log('Raw payment link data:', rawLinkData);
        
        // In this module version, we'll add isActive if not already present
        const linkData = {
          ...rawLinkData,
          isActive: rawLinkData.isActive !== undefined ? 
                    rawLinkData.isActive : 
                    (rawLinkData.is_active !== false) // Default to true if not explicitly false
        };
        
        // Log the active status for debugging
        console.log('Module - Payment link active check:', {
          id: linkData.id,
          status: linkData.status,
          isActive: linkData.isActive,
          isActiveByFunction: isPaymentLinkActive(linkData)
        });
        
        // Validate the payment amount
        console.log('Payment amount in pence:', linkData.amount);
        if (!validatePenceAmount(linkData.amount, 'usePaymentLinkData')) {
          console.warn(`usePaymentLinkData: Payment amount validation failed: ${linkData.amount}`);
          
          // If the amount is 0 or invalid, set a minimum amount for safety
          if (linkData.amount <= 0) {
            console.warn('usePaymentLinkData: Setting minimum amount of 100 pence (£1)');
            linkData.amount = 100; // Set minimum to £1 (100p)
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
