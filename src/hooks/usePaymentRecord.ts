
import { useState } from 'react';
import { toast } from 'sonner';
import { PaymentLinkData } from './usePaymentLinkData';
import { supabase } from '@/integrations/supabase/client';

export function usePaymentRecord() {
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  const createPaymentRecord = async ({
    paymentIntent,
    linkData,
    formData,
    associatedPaymentLinkId
  }: {
    paymentIntent: any;
    linkData: PaymentLinkData;
    formData: {
      name: string;
      email: string;
      phone?: string;
    };
    associatedPaymentLinkId?: string;
  }) => {
    if (!paymentIntent || !paymentIntent.id) {
      console.error('Missing payment intent data');
      return { success: false, error: 'Invalid payment data' };
    }

    setIsCreatingRecord(true);
    
    try {
      console.log('Payment was successful:', paymentIntent.id);
      
      // Display success message in the UI
      toast.success(`Payment successful! The payment reference will be shown on the next page.`);
      
      // Get the payment reference from metadata (should be consistent with webhook)
      const paymentReference = paymentIntent.metadata?.paymentReference;
      
      if (!paymentReference) {
        console.warn('No payment reference found in metadata. This may indicate an issue with the payment intent creation.');
      }
      
      // Maximum number of retries and initial delay
      const maxRetries = 5;
      const initialDelayMs = 2000;
      let currentRetry = 0;
      let existingPayment = null;
      
      // Function to check if payment record exists with exponential backoff
      const checkForPaymentRecord = async () => {
        while (currentRetry < maxRetries) {
          // Calculate delay with exponential backoff
          const delayMs = initialDelayMs * Math.pow(1.5, currentRetry);
          console.log(`Waiting ${delayMs}ms before checking for payment record (attempt ${currentRetry + 1}/${maxRetries})`);
          
          // Wait for the calculated delay
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // Check if payment record already exists
          const { data, error } = await supabase
            .from('payments')
            .select('id, payment_ref')
            .eq('stripe_payment_id', paymentIntent.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking for existing payment:', error);
          }
          
          // If record exists, return it
          if (data) {
            console.log('Payment record found, created by webhook:', data);
            return data;
          }
          
          console.log(`Payment record not found after attempt ${currentRetry + 1}/${maxRetries}`);
          currentRetry++;
        }
        
        return null;
      };
      
      // Check if payment record already exists
      existingPayment = await checkForPaymentRecord();
      
      // If the webhook hasn't created the record yet, create it directly as a fallback
      if (!existingPayment) {
        console.log('Payment record not found after all retries, creating directly as fallback');
        
        // Use the payment reference from metadata
        const paymentRef = paymentReference || 
          `CLN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        console.log(`Using payment reference for fallback creation: ${paymentRef}`);
        
        // Calculate the amount in cents (as integer)
        const amountInCents = paymentIntent.amount;
        
        // Create payment record - use an upsert operation with a constraint on stripe_payment_id
        // This will ensure we don't create a duplicate if the webhook finally processed
        const { data: insertedData, error: insertError } = await supabase
          .from('payments')
          .upsert({
            clinic_id: paymentIntent.metadata?.clinicId || linkData.clinic.id,
            payment_link_id: paymentIntent.metadata?.paymentLinkId || associatedPaymentLinkId || linkData.id,
            patient_name: formData.name,
            patient_email: formData.email, 
            patient_phone: formData.phone,
            amount_paid: amountInCents,  // Store as integer cents
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_payment_id: paymentIntent.id,
            payment_ref: paymentRef
          }, { 
            onConflict: 'stripe_payment_id',
            returning: 'minimal' // Don't need the returned data
          });
          
        if (insertError) {
          console.error('Fallback payment record creation failed:', insertError);
          // Don't return error here, as the payment itself was successful
          // The webhook may still create the record later
        } else {
          console.log('Successfully created fallback payment record');
          toast.info('Payment record created using fallback method. Full payment details may take a moment to appear.');
        }
      } else {
        console.log(`Webhook successfully created payment record with reference: ${existingPayment.payment_ref}`);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error recording payment:', error);
      return { success: false, error: error.message };
    } finally {
      setIsCreatingRecord(false);
    }
  };

  return {
    isCreatingRecord,
    createPaymentRecord
  };
}
