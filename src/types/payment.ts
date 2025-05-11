
export interface Payment {
  id: string;
  amount: number;
  clinicId: string;
  date: string;
  patientName: string;
  patientEmail?: string;
  status: string;
  refundAmount?: number;
  netAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  stripePaymentId?: string;
  manualPayment?: boolean; // Added new field for manual payments
}

export enum PaymentStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
  FAILED = 'failed',
  PENDING = 'pending'
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

