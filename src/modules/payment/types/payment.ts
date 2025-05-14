// Define common payment-related types for the payment module

// PaymentLink type definition to match the database schema
export interface PaymentLink {
  id: string;
  title?: string;
  description?: string;
  amount: number;
  clinic_id: string;
  patient_id?: string;
  payment_request_id?: string;
  user_id?: string;
  is_active?: boolean;
  payment_plan?: boolean;
  payment_count?: number;
  plan_total_amount?: number;
  paymentPlan?: boolean;
  paymentCount?: number;
  paymentCycle?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  isRequest?: boolean;
  createdAt?: string;
}

// Add other payment related types as needed
export interface PaymentData {
  id?: string;
  amount: number;
  message?: string;
  status?: string;
}

// Export the types
