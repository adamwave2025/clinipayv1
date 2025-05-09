
import { format } from 'date-fns';

// Define the PlanInstallment interface
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
 * Format installments from the database into frontend format
 * 
 * @param installments Raw installment data from the database
 * @returns Formatted installments for frontend use
 */
export const formatPlanInstallments = (installments: any[]): PlanInstallment[] => {
  return installments.map(installment => ({
    id: installment.id,
    dueDate: installment.due_date,
    amount: installment.amount,
    status: installment.status,
    paidDate: installment.payment_requests?.paid_at || null,
    paymentNumber: installment.payment_number,
    totalPayments: installment.total_payments,
    paymentRequestId: installment.payment_request_id
  }));
};

/**
 * Check if an installment is overdue
 */
export const isInstallmentOverdue = (installment: PlanInstallment): boolean => {
  if (installment.status === 'paid') return false;
  
  const now = new Date();
  const dueDate = new Date(installment.dueDate);
  
  return dueDate < now;
};

/**
 * Get the appropriate status for an installment
 */
export const getInstallmentStatus = (installment: PlanInstallment): 'paid' | 'upcoming' | 'overdue' => {
  if (installment.status === 'paid') {
    return 'paid';
  }
  
  return isInstallmentOverdue(installment) ? 'overdue' : 'upcoming';
};
