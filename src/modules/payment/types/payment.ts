
export interface Payment {
  id: string;
  amount_paid: number;
  paid_at: string;
  status: string;
  patient_name: string;
  patient_email?: string;
  patient_id?: string;
  payment_link_id?: string;
  stripe_payment_id?: string;
  payment_ref?: string;
  refund_amount?: number;
  refunded_at?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalRevenue: number;
  averagePayment: number;
  recentPayments: Payment[];
  thisWeekRevenue: number;
  lastWeekRevenue: number;
  changePercentage: number;
}
