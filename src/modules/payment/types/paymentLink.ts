
/**
 * Interface representing a payment link in the system
 */
export interface PaymentLink {
  id: string;
  clinic_id: string;
  title: string;
  description?: string;
  amount: number;
  type?: string;
  is_active: boolean;
  created_at: string;
  payment_plan: boolean;
  payment_count?: number;
  payment_cycle?: string;
  plan_total_amount?: number;
}

/**
 * Interface representing processed payment link information
 */
export interface ProcessedPaymentLink {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type?: string;
  status?: string;
  createdAt: string;
  isActive: boolean;
  paymentPlan: boolean;
  paymentCount?: number;
  paymentCycle?: string;
  planTotalAmount?: number;
  clinic_id: string;
}

/**
 * Interface representing payment link data with clinic information
 */
export interface PaymentLinkData {
  id: string;
  title?: string;
  type?: string;
  amount: number;
  description?: string;
  clinic: {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
    stripeStatus: string;
  };
  status: string;
  isActive?: boolean;
  isPaymentPlan?: boolean;
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  customAmount?: number;
  hasOverduePayments?: boolean;
  payment_link_id?: string;
  isRescheduled?: boolean;
  isRequest: boolean;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  paymentId?: string;
}
