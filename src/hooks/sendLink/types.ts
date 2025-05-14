
import { StandardNotificationPayload } from '@/types/notification';

export interface SendLinkFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectedLink: string;
  customAmount: string;
  message: string;
  scheduledDate?: Date | null;
}

export interface PaymentLinkSenderProps {
  formData: SendLinkFormData;
  paymentLinks: any[];
  patientId?: string;
}

export interface PaymentLinkSenderResult {
  success: boolean;
  error?: string;
}

export interface NotificationPayloadData {
  clinic: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  patient: {
    name: string;
    email?: string;
    phone?: string;
  };
  payment: {
    reference: string;
    amount: number;
    refund_amount: null;
    payment_link: string;
    message: string;
  };
}
