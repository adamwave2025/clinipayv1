
import React, { useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe('pk_test_51OgHYeEXQXA8Yw4lPwEiRXfBg5MCGN8Ri3aELhMOgYm1YyY6SeBwsJcEvL6GZ7fhitWDIyHjRsZ4s3lw2tJgPnzq00dBEHEp2C');

const PatientPaymentPage = () => {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const { linkData, isLoading, error } = usePaymentLinkData(linkId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Redirect if link not found
  React.useEffect(() => {
    if (!isLoading && (error || !linkData)) {
      navigate('/payment/failed');
    }
  }, [isLoading, error, linkData, navigate]);

  const createPaymentIntent = async () => {
    if (!linkData) return null;
    
    // Check if the clinic has Stripe connected
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return null;
    }
    
    try {
      setProcessingPayment(true);
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

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to create payment intent';
        } catch (e) {
          // If not valid JSON, use the text directly
          errorMessage = `Server error: ${errorText.slice(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setProcessingPayment(false);
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setProcessingPayment(false);
      toast.error('Payment setup failed: ' + error.message);
      return null;
    }
  };

  const handlePaymentSubmit = async (formData: PaymentFormValues) => {
    if (!linkData) return;
    
    // Check if the clinic has Stripe connected before attempting payment
    if (linkData.clinic.stripeStatus !== 'connected') {
      toast.error('This clinic does not have payment processing set up');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First create a payment intent
      const secret = await createPaymentIntent();
      if (!secret) {
        throw new Error('Could not create payment intent');
      }
      
      setClientSecret(secret);
      
      // After successful payment, create a payment record
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clinic_id: linkData.clinic.id,
          payment_link_id: linkData.isRequest ? null : linkData.id,
          patient_name: formData.name,
          patient_email: formData.email,
          patient_phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
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
      toast.error('Payment failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // At this point, linkData should be available if it exists
  if (!linkData) {
    return null; // Will redirect via useEffect
  }

  const clinicData = linkData.clinic;
  const paymentType = linkData.title || 'Payment';
  const isStripeConnected = clinicData.stripeStatus === 'connected';

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
          
          {!isStripeConnected ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Payment Unavailable</AlertTitle>
              <AlertDescription>
                This clinic has not set up payment processing. Please contact the clinic directly to arrange payment.
              </AlertDescription>
            </Alert>
          ) : clientSecret && processingPayment ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
              <p className="ml-3 text-gray-600">Processing payment...</p>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
              <PaymentForm 
                onSubmit={handlePaymentSubmit}
                isLoading={isSubmitting}
                defaultValues={defaultValues}
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </PaymentLayout>
  );
};

export default PatientPaymentPage;
