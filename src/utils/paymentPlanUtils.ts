
import { formatCurrency } from './formatters';

export interface PlanInstallment {
  id: string;
  paymentNumber: number;
  totalPayments: number;
  dueDate: string;
  amount: number;
  status: string;
  paymentRequestId?: string;
  planId: string;
  manualPayment?: boolean;
  paidDate?: string | null;
  payment?: any;
  refundAmount?: number;
  clientReference?: string;
  paymentReference?: string;
  // Add this field to track original status before refund
  originalStatus?: string;
}

export const formatPlanInstallments = (scheduleData: any[]): PlanInstallment[] => {
  if (!scheduleData || !Array.isArray(scheduleData)) return [];
  
  return scheduleData.map(item => {
    // Determine payment reference and refund amount
    let paymentRef = '';
    let refundAmount = 0;
    
    // Check direct payment data first
    if (item.payments) {
      paymentRef = item.payments.payment_ref || '';
      refundAmount = item.payments.refund_amount || 0;
    }
    // Fallback to linked payment via payment_request
    else if (item.payment_requests && item.payment_requests.payments) {
      paymentRef = item.payment_requests.payments.payment_ref || '';
      refundAmount = item.payment_requests.payments.refund_amount || 0;
    }
    
    return {
      id: item.id,
      paymentNumber: item.payment_number,
      totalPayments: item.total_payments,
      dueDate: item.due_date,
      amount: item.amount,
      status: item.status,
      paymentRequestId: item.payment_request_id || null,
      planId: item.plan_id,
      manualPayment: item.manualPayment || false,
      paidDate: item.paidDate || null,
      refundAmount: item.refund_amount || refundAmount || 0, // Get refund amount from schedule item or payment
      clientReference: '', // Can be added later if needed
      paymentReference: paymentRef,
      originalStatus: item.original_status || null, // Add this field to store original status before refund
    };
  });
};

// Add the missing formatInstallmentFromDb function
export const formatInstallmentFromDb = (data: any): PlanInstallment => {
  // Determine payment reference and refund amount
  let paymentRef = '';
  let refundAmount = 0;
  
  // Check direct payment data first
  if (data.payments) {
    paymentRef = data.payments.payment_ref || '';
    refundAmount = data.payments.refund_amount || 0;
  }
  // Fallback to linked payment via payment_request
  else if (data.payment_requests && data.payment_requests.payments) {
    paymentRef = data.payment_requests.payments.payment_ref || '';
    refundAmount = data.payment_requests.payments.refund_amount || 0;
  }
  
  return {
    id: data.id,
    paymentNumber: data.payment_number,
    totalPayments: data.total_payments,
    dueDate: data.due_date,
    amount: data.amount,
    status: data.status,
    paymentRequestId: data.payment_request_id || null,
    planId: data.plan_id,
    manualPayment: data.manual_payment || false,
    paidDate: data.paid_at || null,
    refundAmount: data.refund_amount || refundAmount || 0,
    clientReference: '', // Can be added later if needed
    paymentReference: paymentRef,
    originalStatus: data.original_status || null,
  };
};

export function getInstallmentStatusText(status: string): string {
  switch (status) {
    case 'paid': return 'Paid';
    case 'due': return 'Due';
    case 'overdue': return 'Overdue';
    case 'pending': return 'Pending';
    case 'paused': return 'Paused';
    case 'refunded': return 'Refunded';
    case 'partially_refunded': return 'Partially Refunded';
    case 'cancelled': return 'Cancelled';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function getInstallmentStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'text-green-600';
    case 'due': return 'text-blue-600';
    case 'overdue': return 'text-red-600';
    case 'pending': return 'text-gray-600';
    case 'paused': return 'text-amber-600';
    case 'refunded': return 'text-purple-600';
    case 'partially_refunded': return 'text-purple-600';
    case 'cancelled': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function formatInstallmentAmount(installment: PlanInstallment): string {
  if (installment.status === 'refunded') {
    return `${formatCurrency(installment.amount)} (Refunded)`;
  } else if (installment.status === 'partially_refunded' && installment.refundAmount) {
    return `${formatCurrency(installment.amount)} (${formatCurrency(installment.refundAmount)} refunded)`;
  }
  return formatCurrency(installment.amount);
}
