
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
  
  useEffect(() => {
    // Fetch the payment reference if a payment ID is provided
    const fetchPaymentReference = async () => {
      if (paymentId) {
        try {
          const { data, error } = await supabase
            .from('payments')
            .select('payment_ref')
            .eq('id', paymentId)
            .single();
            
          if (error) {
            console.error('Error fetching payment reference:', error);
            return;
          }
          
          if (data && data.payment_ref) {
            setPaymentReference(data.payment_ref);
          }
        } catch (err) {
          console.error('Error fetching payment reference:', err);
        }
      }
    };
    
    fetchPaymentReference();
  }, [paymentId]);
  
  useEffect(() => {
    if (linkData) {
      const details: PaymentDetail[] = [
        { label: 'Amount Paid', value: `£${linkData.amount.toFixed(2)}` },
        { label: 'Date', value: new Date().toLocaleDateString() },
        { label: 'Clinic', value: linkData.clinic.name },
        { label: 'Payment Type', value: linkData.type.charAt(0).toUpperCase() + linkData.type.slice(1) },
      ];
      
      // Only add reference to details if there's no dedicated reference display
      if (!paymentReference) {
        details.push({ 
          label: 'Reference', 
          value: paymentId || linkId || 'Unknown', 
          colSpan: 2 
        });
      }
      
      setPaymentDetails(details);
    }
  }, [linkData, linkId, paymentId, paymentReference]);

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
      
      {paymentReference && (
        <PaymentReferenceDisplay 
          reference={paymentReference} 
          className="mb-6"
        />
      )}
      
      <ClinicInformationCard 
        clinicDetails={{
          name: linkData.clinic.name,
          email: linkData.clinic.email || '',
          phone: linkData.clinic.phone || '',
          address: linkData.clinic.address || '',
          logo: linkData.clinic.logo // This is now optional in the interface
        }} 
      />
    </PaymentLayout>
  );
};

export default PaymentSuccessPage;
