
// Add an explicit export keyword to the PaymentLinkData interface
export interface PaymentLinkData {
  id: string;
  title?: string;
  amount: number;
  status: string; // 'active', 'paid', 'cancelled', 'paused', 'overdue', 'rescheduled'
  clinic: ClinicDetails;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  message?: string;
  isRequest: boolean;
  paymentId?: string;
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  payment_link_id?: string;
  isActive?: boolean; // Add the isActive property from is_active in DB
  isRescheduled?: boolean;
  customAmount?: number;
  hasOverduePayments?: boolean;
  type?: string;
  description?: string;
}

export interface ClinicDetails {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  stripeStatus: string;
}
