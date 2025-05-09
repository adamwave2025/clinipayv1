
import { useState, useEffect } from 'react';
import { PaymentLinkData } from '../types/paymentLink';
import { PaymentLinkService } from '../services/PaymentLinkService';
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
        const requestData = await PaymentLinkService.fetchPaymentRequest(linkId);
        
        // If we found a payment request, format it
        if (requestData) {
          console.log('usePaymentLinkData: Found payment request:', requestData);
          
          // Format the payment request data
          const formattedRequestData: PaymentLinkData = {
            id: requestData.id,
            title: requestData.title,
            amount: requestData.amount,
            status: requestData.status,
            clinic: {
              id: requestData.clinic.id,
              name: requestData.clinic.name,
              email: requestData.clinic.email,
              phone: requestData.clinic.phone,
              address: requestData.clinic.address,
              logo: requestData.clinic.logo,
              stripeStatus: requestData.clinic.stripe_status
            },
            patientName: requestData.patient_name,
            patientEmail: requestData.patient_email,
            patientPhone: requestData.patient_phone,
            message: requestData.message,
            isRequest: true,
            paymentId: requestData.payment_id,
            paymentPlan: requestData.payment_plan
          };

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
          
          console.log('usePaymentLinkData: Successfully formatted payment request data');
          setLinkData(formattedRequestData);
          setIsLoading(false);
          return;
        }
        
        console.log(`usePaymentLinkData: No payment request found for ID ${linkId}, trying payment link`);
        
        // If not a payment request, try to find as a regular payment link
        const linkData = await PaymentLinkService.fetchPaymentLink(linkId);

        if (!linkData) {
          console.error(`usePaymentLinkData: Payment link not found for ID ${linkId}`);
          throw new Error('Payment link not found');
        }

        console.log('usePaymentLinkData: Found payment link:', linkData);
        
        // Format the payment link data
        const formattedLinkData: PaymentLinkData = {
          id: linkData.id,
          title: linkData.title,
          amount: linkData.amount,
          status: linkData.status,
          clinic: {
            id: linkData.clinic.id,
            name: linkData.clinic.name,
            email: linkData.clinic.email,
            phone: linkData.clinic.phone,
            address: linkData.clinic.address,
            logo: linkData.clinic.logo,
            stripeStatus: linkData.clinic.stripe_status
          },
          isRequest: false,
          paymentPlan: linkData.payment_plan
        };
        
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
