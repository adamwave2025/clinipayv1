
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '@/components/payment/PaymentForm';
import { PaymentFormValues } from '@/components/payment/form/FormSchema';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import PaymentPageClinicCard from '@/components/payment/PaymentPageClinicCard';
import CliniPaySecuritySection from '@/components/payment/CliniPaySecuritySection';
import { Card, CardContent } from '@/components/ui/card';
import { usePaymentLinkData } from '@/hooks/usePaymentLinkData';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe('pk_test_51OgHYeEXQXA8Yw4lPwEiRXfBg5MCGN8Ri3aELhMOgYm1YyY6SeBwsJcEvL6GZ7fhitWDIyHjRsZ4s3lw2tJgPnzq00dBEHEp2C');

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);

  // Create PaymentIntent when the page loads
  useEffect(() => {
    if (linkData) {
      createPaymentIntent();
    }
  }, [linkData]);

  const createPaymentIntent = async () => {
    if (!linkData) return;

    try {
      setPaymentIntentError(null);
      const response = await fetch(`${window.location.origin}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: linkData.amount * 100, // Convert to pence
          clinicId: linkData.clinic.id,
          paymentLinkId: linkData.isRequest ? null : linkData.id,
          requestId: linkData.isRequest ? linkData.id : null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setPaymentIntentError(error.message);
      toast.error('Failed to set up payment: ' + error.message);
    }
  };

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData || !clientSecret) return;
    
    setIsSubmitting(true);
    
    try {
      // Store phone number as text to preserve leading zeros
      const phoneNumber = formData.phone ? formData.phone.replace(/\D/g, '') : null;
      
      // Create a payment record
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: linkData.isRequest ? null : linkData.id,
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: phoneNumber,
          status: 'paid',
          amount_paid: linkData.amount,
          paid_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;

      // If this was a payment request, update its status and paid_at
      if (linkData.isRequest) {
        await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_id: data[0].id
          })
          .eq('id', linkData.id);
      }
      
      // Navigate to success page with the link_id parameter
      navigate(`/payment/success?link_id=${linkId}&payment_id=${data[0].id}`);
    } catch (error) {
      console.error('Payment error:', error);
      navigate('/payment/failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if link not found
  useEffect(() => {
    if (!isLoading && (error || !linkData)) {
      navigate('/payment/failed');
    }
  }, [isLoading, error, linkData, navigate]);

  // Prepare default values from payment request patient info
  const defaultValues = linkData?.isRequest ? {
    name: linkData.patientName || '',
    email: linkData.patientEmail || '',
    phone: linkData.patientPhone || '',
  } : undefined;

  if (isLoading) {
    return (
      <PaymentLayout isSplitView={false} hideHeaderFooter={false}>
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner size="lg" />
          <p className="ml-3 text-gray-600">Loading payment information...</p>
        </div>
      </PaymentLayout>
    );
  }

  if (paymentIntentError) {
    return (
      <PaymentLayout isSplitView={false} hideHeaderFooter={false}>
        <div className="text-center p-6">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Setup Failed</h2>
          <p className="text-gray-600 mb-4">{paymentIntentError}</p>
          <p className="text-sm text-gray-500">Please contact the clinic directly to complete your payment.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Return Home
          </button>
        </div>
      </PaymentLayout>
    );
  }

  // At this point, linkData should be available if it exists
  if (!linkData) {
    return null; // Will redirect via useEffect
  }

  const clinicData = linkData.clinic;
  const paymentType = linkData.title || 'Payment';

  return (
    <PaymentLayout isSplitView={true} hideHeaderFooter={true}>
      {/* Left Column - Clinic Info & Security */}
      <div className="space-y-4">
        {clinicData && (
          <PaymentPageClinicCard clinic={{
            name: clinicData.name,
            logo: clinicData.logo || '',
            email: clinicData.email,
            phone: clinicData.phone,
            address: clinicData.address,
            paymentType: paymentType,
            amount: linkData.amount
          }} />
        )}
        <CliniPaySecuritySection />
      </div>
      
      {/* Right Column - Payment Form */}
      <Card className="card-shadow h-full">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
            Complete Your Payment
          </h2>
          
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm 
                onSubmit={handlePaymentSubmit}
                isLoading={isSubmitting}
                defaultValues={defaultValues}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
              <p className="ml-3 text-gray-600">Initializing payment...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
