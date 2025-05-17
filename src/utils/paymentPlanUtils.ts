
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
  originalStatus?: string;
  paymentNumber: number;
  totalPayments: number;
  paymentRequestId?: string;
  paymentId?: string;
  manualPayment?: boolean;
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
    originalStatus: data.original_status,
    paymentNumber: data.payment_number || 0,
    totalPayments: data.total_payments || 0,
    paymentRequestId: data.payment_request_id,
    paymentId: data.payment_id,
    manualPayment: data.manualPayment || false
  };
};

/**
 * Format a collection of installments from database format
 */
export const formatPlanInstallments = (installments: any[]): PlanInstallment[] => {
  if (!Array.isArray(installments)) {
    console.error('formatPlanInstallments received invalid input:', installments);
    return [];
  }

  return installments.map(item => {
    // Map database field names to our interface
    return {
      id: item.id,
      planId: item.plan_id,
      amount: item.amount || 0,
      dueDate: item.due_date,
      paidDate: item.paidDate || item.paid_date || null,
      status: item.status || 'pending',
      originalStatus: item.original_status,
      paymentNumber: item.payment_number || 0,
      totalPayments: item.total_payments || 0,
      paymentRequestId: item.payment_request_id,
      paymentId: item.payment_id,
      manualPayment: item.manualPayment || false
    };
  });
};
