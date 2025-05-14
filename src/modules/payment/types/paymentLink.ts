
// Define the PaymentLinkData interface which represents payment link data
export interface PaymentLinkData {
  id: string;
  title?: string;
  description?: string;
  amount: number;
  isPaymentPlan?: boolean;
  paymentPlan?: boolean; // Add for backward compatibility
  paymentCount?: number;
  paymentCycle?: string;
  status: string; // Make status required
  isActive?: boolean;
  isRequest: boolean; // Make isRequest required
  url?: string;
  clinic: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    stripeStatus?: string;
    address?: string;
    logo?: string; // Add logo property
  };
  createdAt?: string;
  // Add additional fields that might be used elsewhere
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  planTotalAmount?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  type?: string;
  payment_link_id?: string;
  isRescheduled?: boolean;
  customAmount?: number;
  hasOverduePayments?: boolean;
  paymentId?: string;
}
