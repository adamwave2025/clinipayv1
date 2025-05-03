
// If we need to add or modify types, let's create a file for this
import { PaymentLinkData, RawClinicData } from './paymentLink';

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
