
import { format, parseISO, isAfter, startOfDay } from 'date-fns';

export interface PaymentScheduleItem {
  id: string;
  patient_id: string;
  payment_link_id: string;
  amount: number;
  due_date: string;
  payment_number: number;
  total_payments: number;
  status: string;
  payment_request_id?: string;
  created_at?: string; 
  payment_requests?: {
    id: string;
    status?: string;
    payment_id?: string;
    paid_at?: string;
  };
  patients?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  payment_links?: {
    id: string;
    title: string;
    amount: number;
    plan_total_amount?: number;
  };
}

export interface PlanInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: string;
  paidDate: string | null;
  paymentNumber: number;
  totalPayments: number;
  paymentRequestId?: string;
}

/**
 * Helper function to determine if an installment has been paid
 * Checks for valid payment_request_id and completed payment
 */
const isPlanInstallmentPaid = (entry: PaymentScheduleItem): boolean => {
  // Check if the payment_request_id exists and payment_id exists in the payment_requests object
  const isPaid = (entry.status === 'sent' || entry.status === 'processed' || entry.status === 'paid') && 
                 entry.payment_request_id !== null && 
                 entry.payment_requests !== null &&
                 entry.payment_requests.payment_id !== null;
  
  return isPaid;
};

export const formatPlanInstallments = (installmentData: any[]): PlanInstallment[] => {
  return installmentData.map(item => {
    const dueDate = format(parseISO(item.due_date), 'yyyy-MM-dd');
    const paidDate = item.payment_requests?.paid_at 
      ? format(parseISO(item.payment_requests.paid_at), 'yyyy-MM-dd')
      : null;
      
    // Use the same paid detection logic as in groupPaymentSchedulesByPlan
    const isPaid = (item.status === 'sent' || item.status === 'processed' || item.status === 'paid') &&
                   item.payment_request_id !== null && 
                   item.payment_requests !== null &&
                   item.payment_requests.payment_id !== null;
    
    // Determine status accurately - FIXED: normalize date comparisons
    const now = startOfDay(new Date()); // Reset time to start of day
    const due = startOfDay(parseISO(item.due_date)); // Reset time to start of day
    
    let status;
    
    if (isPaid) {
      status = 'paid';
    } else if (item.status === 'cancelled') {
      status = 'cancelled';
    } else if (item.status === 'paused') {
      status = 'paused';  
    } else if (item.status === 'sent' || item.status === 'processed') {
      // If sent/processed but due date has passed, mark as overdue
      // Only mark as overdue if the due date is BEFORE today (not equal to today)
      status = now > due ? 'overdue' : 'sent';
    } else if (item.status === 'pending') {
      // Check if it's overdue
      status = now > due ? 'overdue' : 'upcoming';
    } else {
      status = item.status;
    }
    
    return {
      id: item.id,
      dueDate,
      amount: item.amount,
      status,
      paidDate,
      paymentNumber: item.payment_number,
      totalPayments: item.total_payments,
      paymentRequestId: item.payment_request_id
    };
  });
};
