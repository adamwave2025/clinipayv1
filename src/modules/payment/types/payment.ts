
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
}

export enum PaymentStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
  FAILED = 'failed',
  PENDING = 'pending'
}
