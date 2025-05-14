
/**
 * Interface representing a payment record in the system
 */
export interface Payment {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  amount_paid: number;
  paid_at: string | null;
  patient_name: string | null;
  patient_email: string | null;
  patient_phone: string | null;
  payment_ref: string | null;
  clinic_id: string;
  payment_link_id: string | null;
  stripe_payment_id: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  stripe_refund_id: string | null;
  stripe_refund_fee: number | null;
  stripe_fee: number | null;
  platform_fee: number | null;
  net_amount: number | null;
  patient_id?: string;
  payment_schedule_id?: string;
  manual_payment?: boolean;
}

/**
 * Interface representing a payment link in the module scope
 */
export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type?: string;
  description?: string;
  url?: string;
  createdAt?: string;
  isActive?: boolean;
  paymentPlan?: boolean;
  paymentCount?: number;
  paymentCycle?: string;
  planTotalAmount?: number;
}

/**
 * Interface representing payment stats
 */
export interface PaymentStats {
  totalReceivedToday: number;
  totalPendingToday: number;
  totalReceivedMonth: number;
  totalRefundedMonth: number;
}
