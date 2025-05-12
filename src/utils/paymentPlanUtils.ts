/**
 * Represents a single installment payment in a payment plan
 */
export interface PlanInstallment {
  id: string;
  planId: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  paymentNumber: number;
  totalPayments: number;
  paymentRequestId?: string;
  // Add any other fields that might be needed
}

/**
 * Format database payment schedule data to PlanInstallment interface
 */
export const formatInstallmentFromDb = (data: any): PlanInstallment => {
  return {
    id: data.id,
    planId: data.plan_id,
    amount: data.amount || 0,
    dueDate: data.due_date,
    paidDate: data.paid_date,
    status: data.status || 'pending',
    paymentNumber: data.payment_number || 0,
    totalPayments: data.total_payments || 0,
    paymentRequestId: data.payment_request_id
  };
};
