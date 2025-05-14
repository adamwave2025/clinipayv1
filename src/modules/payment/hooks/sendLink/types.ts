
// Import types from the correct location
import { StandardNotificationPayload } from '../../types/notification';

export interface SendLinkFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectedLink: string;
  customAmount: string;
  message: string;
  startDate?: Date | string | null;
  scheduledDate?: Date | null;
}

export interface PaymentLinkSenderProps {
  formData: SendLinkFormData;
  clinicId: string;
  patientId?: string;
}

export interface PaymentLinkSenderResult {
  success: boolean;
  paymentRequestId?: string;
  notificationSent?: boolean;
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
