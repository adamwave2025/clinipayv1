
// Add or update PlanInstallment interface to include originalStatus
export interface PlanInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string;
  originalStatus?: string; // Add this property to track original status before pausing
  paymentRequestId?: string; // Add this property which is required by usePaymentDetailsFetcher
  paymentNumber?: number;
  totalPayments?: number;
}

export interface PaymentScheduleItem {
  id: string;
  clinic_id: string;
  patient_id?: string;
  payment_link_id: string;
  payment_request_id?: string;
  amount: number;
  payment_frequency: string;
  due_date: string;
  status: string;
  payment_number: number;
  total_payments: number;
  created_at?: string;
  updated_at?: string;
  plan_id?: string;
  payment_requests?: {
    id: string;
    status: string;
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
    title?: string;
    amount?: number;
    plan_total_amount?: number;
  };
}

/**
 * Format payment schedule items into plan installments for display
 */
export const formatPlanInstallments = (scheduleItems: any[]): PlanInstallment[] => {
  if (!scheduleItems || scheduleItems.length === 0) return [];
  
  return scheduleItems.map(item => {
    // Check if the item has payment_requests and if so, get the payment date
    const paidDate = item.payment_requests?.paid_at || undefined;
    
    return {
      id: item.id,
      dueDate: item.due_date,
      amount: item.amount,
      status: item.status,
      paidDate,
      originalStatus: item.status === 'paused' ? item.status : undefined,
      paymentRequestId: item.payment_request_id,
      paymentNumber: item.payment_number,
      totalPayments: item.total_payments
    };
  });
};

/**
 * Group payment schedule items by plan to create plan objects
 */
export const groupPaymentSchedulesByPlan = (scheduleItems: PaymentScheduleItem[]) => {
  const planMap = new Map();
  
  if (!scheduleItems || scheduleItems.length === 0) return planMap;
  
  for (const item of scheduleItems) {
    const planId = item.plan_id || '';
    const paymentLinkId = item.payment_link_id;
    const patientId = item.patient_id || '';
    const clinicId = item.clinic_id;
    
    // Create a unique key for this plan
    const planKey = `${paymentLinkId}-${patientId}`;
    
    if (!planMap.has(planKey)) {
      // Get patient info if available
      const patientName = item.patients?.name || 'Unknown Patient';
      const patientEmail = item.patients?.email || '';
      const patientPhone = item.patients?.phone || '';
      
      // Get payment link info if available
      const planTitle = item.payment_links?.title || 'Payment Plan';
      const totalAmount = item.payment_links?.plan_total_amount || 0;
      
      // Check if the plan has overdue payments
      const isOverdue = item.status === 'overdue';
      
      // Calculate the earliest due date for upcoming payments
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Convert due_date string to Date for comparison
      const dueDate = new Date(item.due_date);
      const nextDueDate = dueDate > today ? dueDate : undefined;
      
      // Create a new plan object
      planMap.set(planKey, {
        id: planId,
        patientId,
        patientName,
        patientEmail,
        patientPhone,
        clinicId,
        paymentLinkId,
        planName: planTitle,
        title: planTitle,
        totalAmount,
        startDate: item.due_date, // Using the first item's due date as plan start date
        status: isOverdue ? 'overdue' : 'active',
        hasOverduePayments: isOverdue,
        nextDueDate: nextDueDate?.toISOString().split('T')[0],
        progress: 0, // Will be updated later
        totalInstallments: item.total_payments,
        paidInstallments: 0, // Will be updated later
        frequency: item.payment_frequency
      });
    }
  }
  
  return planMap;
};
