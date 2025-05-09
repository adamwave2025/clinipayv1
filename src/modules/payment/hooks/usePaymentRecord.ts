
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PaymentIntentData = {
  id: string;
  amount: number;
  client_secret: string;
  status: string;
};

type FormData = {
  name: string;
  email: string;
  phone?: string;
};

type LinkData = {
  id: string;
  amount: number;
  isRequest: boolean;
  title?: string;
  clinic: {
    id: string;
    name: string;
  };
};

export function usePaymentRecord() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const createPaymentRecord = async ({
    paymentIntent,
    linkData,
    formData,
    associatedPaymentLinkId
  }: {
    paymentIntent: PaymentIntentData;
    linkData: LinkData;
    formData: FormData;
    associatedPaymentLinkId?: string | null;
  }) => {
    setIsRecording(true);
    setRecordError(null);

    try {
      // No server-side operations needed here - webhooks handle the database update
      console.log('Payment successful:', paymentIntent);
      console.log('Patient details:', formData);
      
      // Note: We're not actually inserting a record here, the webhook does that
      // But we log it here for debugging and completion purposes
      
      return { success: true };
    } catch (error: any) {
      console.error('Error recording payment:', error);
      setRecordError(error.message || 'Failed to record payment');
      return { success: false, error };
    } finally {
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    recordError,
    createPaymentRecord
  };
}
