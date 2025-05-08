
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
      
      // Primarily, the payment record is created by the Stripe webhook
      // However, we'll add a fallback direct creation method to ensure records are created
      
      // Wait a short time to see if the webhook has created the record
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if payment record already exists
      const { data: existingPayment, error: checkError } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_payment_id', paymentIntent.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking for existing payment:', checkError);
      }
      
      // If the webhook hasn't created the record yet, create it directly as a fallback
      if (!existingPayment) {
        console.log('Payment record not found, creating directly as fallback');
        
        // Generate payment reference (should be same logic as in webhook)
        const paymentRef = paymentIntent.metadata?.paymentReference || 
          `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        
        // Calculate the amount in cents (as integer)
        const amountInCents = paymentIntent.amount;
        
        // Create payment record
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
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
          });
          
        if (insertError) {
          console.error('Fallback payment record creation failed:', insertError);
          // Don't return error here, as the payment itself was successful
          // The webhook may still create the record later
        } else {
          console.log('Successfully created fallback payment record');
        }
      } else {
        console.log('Payment record already exists, created by webhook');
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
