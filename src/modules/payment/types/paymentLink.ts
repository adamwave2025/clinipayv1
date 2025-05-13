
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
