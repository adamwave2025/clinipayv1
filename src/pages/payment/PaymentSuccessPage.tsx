
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
  const maxRetries = 5;
  const retryDelayMs = 2000;
  
  // Function to fetch payment reference
  const fetchPaymentReference = async () => {
    if (!paymentId) {
      console.log('No payment ID provided, skipping reference fetch');
      setIsLoadingReference(false);
      return false;
    }
    
    try {
      console.log('Fetching payment reference for payment ID:', paymentId);
      
      const { data, error } = await supabase
        .from('payments')
        .select('payment_ref, stripe_payment_id')
        .eq('stripe_payment_id', paymentId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching payment reference:', error);
        return false;
      }
      
      if (data && data.payment_ref) {
        console.log('Found payment reference:', data.payment_ref);
        setPaymentReference(data.payment_ref);
        setIsLoadingReference(false);
        return true;
      } else {
        console.log('Payment found, but no reference yet:', data);
      }
      
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
        const timeout = setTimeout(() => {
          console.log(`Retrying payment reference fetch (${retryCount + 1}/${maxRetries})...`);
          setRetryCount(prev => prev + 1);
        }, retryDelayMs);
        
        return () => clearTimeout(timeout);
      } else if (!found && retryCount >= maxRetries) {
        setIsLoadingReference(false);
        toast.error("Could not retrieve payment reference. Please contact the clinic for assistance.", {
          duration: 5000,
          id: "payment-reference-error"
        });
      }
    };
    
    initialFetch();
  }, [paymentId, retryCount]);
  
  useEffect(() => {
    if (linkData) {
      const details: PaymentDetail[] = [
        { label: 'Amount Paid', value: `£${linkData.amount.toFixed(2)}` },
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
