
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
