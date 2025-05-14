
// Define the PaymentLinkData interface which represents payment link data
export interface PaymentLinkData {
  id: string;
  title?: string;
  description?: string;
  amount: number;
  isPaymentPlan?: boolean;
  paymentCount?: number;
  paymentCycle?: string;
  status: string; // Required field
  isActive?: boolean;
  isRequest: boolean; // Required field
  url?: string;
  clinic: {
    id: string;
    name: string; // Change to required to match LinkData expectations
    email?: string;
    phone?: string;
    stripeStatus?: string;
    address?: string;
    logo?: string;
  };
  createdAt?: string;
  // Additional fields
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
