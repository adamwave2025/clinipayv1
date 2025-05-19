
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentStatusSummary from '@/components/payment/PaymentStatusSummary';
import PaymentDetailsCard from '@/components/payment/PaymentDetailsCard';
import ClinicInformationCard from '@/components/payment/ClinicInformationCard';
import PaymentReferenceDisplay from '@/components/payment/PaymentReferenceDisplay';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

// Define interface matching PaymentDetailsCard's expected props
interface PaymentDetail {
  label: string;
  value: string | number;
  colSpan?: number;
}

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('link_id');
  const paymentId = searchParams.get('payment_id');
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isLoadingReference, setIsLoadingReference] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // Increased from 8 to 10
  const retryDelayMs = 3000; // Using longer delay of 3000ms
  
  // Function to fetch payment reference
  const fetchPaymentReference = async () => {
    if (!paymentId) {
      console.log('No payment ID provided, skipping reference fetch');
      setIsLoadingReference(false);
      return false;
    }
    
    try {
      console.log('Fetching payment reference for payment ID:', paymentId);
      
      // First try to find by stripe_payment_id
      const { data: paymentByStripeId, error: stripeIdError } = await supabase
        .from('payments')
        .select('payment_ref, id')
        .eq('stripe_payment_id', paymentId)
        .maybeSingle();
        
      if (stripeIdError) {
        console.error('Error fetching payment by stripe_payment_id:', stripeIdError);
        // Continue to try by payment ID as fallback
      } else if (paymentByStripeId && paymentByStripeId.payment_ref) {
        console.log('Found payment reference by stripe_payment_id:', paymentByStripeId.payment_ref);
        setPaymentReference(paymentByStripeId.payment_ref);
        setIsLoadingReference(false);
        return true;
      }
      
      // Try to find by UUID if stripe_payment_id lookup failed
      // This handles the case where paymentId might be a Supabase payment UUID
      try {
        const { data: paymentById, error: idError } = await supabase
          .from('payments')
          .select('payment_ref')
          .eq('id', paymentId)
          .maybeSingle();
          
        if (!idError && paymentById && paymentById.payment_ref) {
          console.log('Found payment reference by payment id:', paymentById.payment_ref);
          setPaymentReference(paymentById.payment_ref);
          setIsLoadingReference(false);
          return true;
        }
      } catch (err) {
        console.log('Error or invalid UUID when looking up by id:', err);
        // Continue with retry logic
      }
      
      console.log('No payment reference found yet');
      return false;
    } catch (err) {
      console.error('Error fetching payment reference:', err);
      return false;
    }
  };
  
  useEffect(() => {
    // Initial fetch of payment reference
    const initialFetch = async () => {
      const found = await fetchPaymentReference();
      
      // If not found and we haven't exceeded retry attempts, set up retry logic
      if (!found && retryCount < maxRetries) {
        // Use exponential backoff for retries
        const delayMs = retryDelayMs * Math.pow(1.5, retryCount);
        
        const timeout = setTimeout(() => {
          console.log(`Retrying payment reference fetch (${retryCount + 1}/${maxRetries})... with delay ${delayMs}ms`);
          setRetryCount(prev => prev + 1);
        }, delayMs);
        
        return () => clearTimeout(timeout);
      } else if (!found && retryCount >= maxRetries) {
        setIsLoadingReference(false);
        toast.error("Could not retrieve payment reference. Please contact the clinic for assistance.", {
          duration: 8000, // Increased duration
          id: "payment-reference-error"
        });
      }
    };
    
    initialFetch();
  }, [paymentId, retryCount]);
  
  useEffect(() => {
    if (linkData) {
      const details: PaymentDetail[] = [
        { label: 'Amount Paid', value: formatCurrency(linkData.amount) },
        { label: 'Date', value: new Date().toLocaleDateString() },
        // Removed the redundant clinic name as it's in the ClinicInformationCard
      ];
      
      // Add the payment title if available
      if (linkData.title) {
        details.push({ label: 'Payment For', value: linkData.title });
      }
      
      // Removed the payment type as it's only for clinics
      
      setPaymentDetails(details);
    }
  }, [linkData]);

  if (isLoading) {
    return (
      <PaymentLayout hideHeaderFooter={true}>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PaymentLayout>
    );
  }

  if (error || !linkData) {
    return (
      <PaymentLayout hideHeaderFooter={true}>
        <PaymentStatusSummary
          status="failed"
          title="Payment Information Unavailable"
          description="We couldn't retrieve your payment information. Please contact the clinic for assistance."
        />
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout hideHeaderFooter={true}>
      <PaymentStatusSummary
        status="success"
        title="Payment Successful!"
        description="Your payment has been processed successfully. A confirmation email has been sent to your email address."
      />
      
      <PaymentDetailsCard details={paymentDetails} />
      
      {isLoadingReference ? (
        <div className="mb-6 p-4 border border-gray-200 rounded-md">
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-500">Generating payment reference...</p>
          </div>
        </div>
      ) : paymentReference ? (
        <PaymentReferenceDisplay 
          reference={paymentReference} 
          className="mb-6"
        />
      ) : (
        <div className="mb-6 p-4 border border-orange-200 bg-orange-50 rounded-md">
          <p className="text-sm text-orange-700">
            Your payment was successful, but we couldn't retrieve a payment reference at this time. 
            Please contact the clinic for your reference number if needed.
          </p>
        </div>
      )}
      
      <ClinicInformationCard 
        clinicDetails={{
          name: linkData.clinic.name,
          email: linkData.clinic.email || '',
          phone: linkData.clinic.phone || '',
          address: linkData.clinic.address || '',
          logo: linkData.clinic.logo
        }} 
      />
    </PaymentLayout>
  );
};

export default PaymentSuccessPage;
