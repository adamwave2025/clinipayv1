
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
  status: string; // Now consistently using the status from the plans table when applicable
  isRequest: boolean;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  paymentId?: string;
  paymentPlan?: boolean;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  hasOverduePayments?: boolean; // From plans table has_overdue_payments flag
}
