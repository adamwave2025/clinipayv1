
import { PaymentLink } from '@/types/payment';
import { StandardNotificationPayload } from '../../types/notification';

export interface SendLinkFormData {
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  selectedLink?: string;
  customAmount?: string;
  message?: string;
  startDate?: Date;
}

export interface PaymentLinkSenderProps {
  formData: SendLinkFormData;
  paymentLinks?: PaymentLink[];
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
    refund_amount?: number | null;
    payment_link?: string;
    message: string;
  };
}

export interface NotificationResult {
  success: boolean;
  delivery?: {
    webhook: boolean;
    edge_function: boolean;
    fallback: boolean;
    any_success: boolean;
  };
  errors?: {
    webhook?: string;
  };
  notification_id?: string;
  error?: string;
}
