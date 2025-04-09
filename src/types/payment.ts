
export interface Payment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  date: string;
  status: 'paid' | 'refunded' | 'sent';
  type: 'deposit' | 'treatment' | 'consultation' | 'other';
}

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  url: string;
  createdAt: string;
}

export interface PaymentStats {
  totalReceivedToday: number;
  totalPendingToday: number;
  totalReceivedMonth: number;
  totalRefundedMonth: number;
}
