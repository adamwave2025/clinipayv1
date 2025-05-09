
// If we need to add or modify types, let's create a file for this
import { PaymentLinkData } from './paymentLink';

export interface Payment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  platformFee?: number; // Added platform fee property
  netAmount?: number; // Added net amount property
  date: string;
  status: 'paid' | 'refunded' | 'sent' | 'partially_refunded';
  type: 'deposit' | 'treatment' | 'consultation' | 'payment_plan' | 'other';
  paymentUrl?: string; // URL for testing payment links
  refundedAmount?: number; // Amount that was refunded (for partial refunds)
  reference?: string; // Payment reference (PAY-XXXX-YYYY)
  linkTitle?: string; // Title of the payment link
  message?: string; // Custom message sent with the payment request
  description?: string; // Description from the payment link
  isCustomAmount?: boolean; // Flag to indicate if it was a custom amount request
  paymentLinkId?: string; // ID of the payment link used (if any)
}

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  description?: string;
  url?: string; 
  createdAt?: string;
  isActive?: boolean;
  paymentPlan?: boolean;
  paymentCount?: number;
  paymentCycle?: string;
  planTotalAmount?: number;
}

export interface PaymentStats {
  totalReceivedToday: number;
  totalPendingToday: number;
  totalReceivedMonth: number;
  totalRefundedMonth: number;
}

export interface PaymentRecord {
  id: string;
  patientName: string;
  patientEmail?: string;
  amount: number;
  status: 'paid' | 'refunded' | 'failed';
  date: string;
  paymentMethod: string;
  reference?: string;
}

export interface PaymentRequest {
  id: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  customAmount?: number;
  paymentLinkId?: string;
  status: 'sent' | 'paid';
  date: string;
  paymentUrl: string;
}

export interface PaymentRefundParams {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
