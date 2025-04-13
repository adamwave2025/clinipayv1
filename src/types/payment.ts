
export interface Payment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  date: string;
  status: 'paid' | 'refunded' | 'sent' | 'partially_refunded';
  type: 'deposit' | 'treatment' | 'consultation' | 'other';
  paymentUrl?: string; // URL for testing payment links
  refundedAmount?: number; // Amount that was refunded (for partial refunds)
  reference?: string; // Payment reference (PAY-XXXX-YYYY)
  linkTitle?: string; // Title of the payment link
  message?: string; // Custom message sent with the payment request
  description?: string; // Description from the payment link
  isCustomAmount?: boolean; // Flag to indicate if it was a custom amount request
  paymentLinkId?: string; // ID of the payment link used (if any)
}

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  description: string;
  url: string;
  createdAt: string;
  isActive?: boolean;
}

export interface PaymentStats {
  totalReceivedToday: number;
  totalPendingToday: number;
  totalReceivedMonth: number;
  totalRefundedMonth: number;
}

export interface PaymentRequest {
  id: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  customAmount?: number;
  paymentLinkId?: string;
  status: 'sent' | 'paid';
  date: string;
  paymentUrl: string;
}
