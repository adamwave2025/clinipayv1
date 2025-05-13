
export interface PaymentLink {
  id: string;
  title?: string;
  description?: string;
  amount: number;
  type?: string;
  is_active: boolean;
  created_at: string;
  clinic_id: string;
  payment_plan?: boolean;
  payment_count?: number;
  payment_cycle?: string;
  plan_total_amount?: number;
}

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
  isRequest: boolean;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  paymentId?: string;
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  customAmount?: number;
  hasOverduePayments?: boolean;
  payment_link_id?: string;
  isRescheduled?: boolean;
}
