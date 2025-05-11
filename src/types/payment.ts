// If we need to add or modify types, let's create a file for this
import { PaymentLinkData } from './paymentLink';

export interface Payment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  platformFee?: number;
  netAmount?: number;
  date: string;
  status: 'paid' | 'refunded' | 'sent' | 'partially_refunded';
  type: 'deposit' | 'treatment' | 'consultation' | 'payment_plan' | 'other';
  paymentUrl?: string;
  refundedAmount?: number;
  reference?: string;
  linkTitle?: string;
  message?: string;
  description?: string;
  isCustomAmount?: boolean;
  paymentLinkId?: string;
  manualPayment?: boolean;
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
