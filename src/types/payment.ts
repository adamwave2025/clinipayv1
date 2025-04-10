
export interface Payment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  date: string;
  status: 'paid' | 'refunded' | 'sent';
  type: 'deposit' | 'treatment' | 'consultation' | 'other';
  paymentUrl?: string; // URL for testing payment links
}

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  description: string;
  url: string;
  createdAt: string;
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
