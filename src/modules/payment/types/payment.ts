
export interface Payment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  status: 'success' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  date: string;
  paymentMethod?: string;
  paymentLinkId?: string;
  clinicId: string;
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
}

export interface PaymentLink {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  createdAt: Date;
  clinicId: string;
  paymentPlan: boolean;
  planDetails: PlanDetails | null;
}

export interface PlanDetails {
  totalAmount: number;
  initialPayment: number;
  numberOfPayments: number;
  frequency: 'weekly' | 'monthly' | 'custom';
}

export interface PaymentStats {
  totalAmount: number;
  count: number;
  avgAmount: number;
  changePercent: number;
}

export interface PaymentRecord {
  id?: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  amount: number;
  clinicId: string;
  paymentLinkId?: string;
  status: string;
  stripePaymentId?: string;
  createdAt?: string;
}

export interface PaymentRequest {
  id: string;
  clinicId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  status: string;
  message?: string;
  createdAt: string;
  paymentLinkId?: string;
  paymentId?: string;
}

export interface PaymentRefundParams {
  paymentId: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  error?: string;
  refundId?: string;
}
