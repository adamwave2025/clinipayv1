
export interface Payment {
  id: string;
  amount: number;
  clinicId: string;
  date: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  status: string;
  refundAmount?: number;
  refundedAmount?: number; // Add this as an alias for refundAmount for backward compatibility
  netAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  reference?: string; // Add this as an alias for paymentReference for backward compatibility
  stripePaymentId?: string;
  manualPayment?: boolean;
  
  // Adding the missing fields used throughout the application
  type?: 'deposit' | 'treatment' | 'consultation' | 'payment_plan' | 'other';
  linkTitle?: string;
  description?: string;
  isCustomAmount?: boolean;
  paymentUrl?: string;
  message?: string;
  paymentLinkId?: string;
  platformFee?: number;
}

export enum PaymentStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
  FAILED = 'failed',
  PENDING = 'pending'
}

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  type: string;
  description?: string;
  url?: string; 
  createdAt?: string;
  isActive?: boolean;
  paymentPlan?: boolean;
  paymentCount?: number;
  paymentCycle?: string;
  planTotalAmount?: number;
}

// Add PaymentStats interface that was referenced but not defined
export interface PaymentStats {
  totalReceivedToday: number;
  totalPendingToday: number;
  totalReceivedMonth: number;
  totalRefundedMonth: number;
}
