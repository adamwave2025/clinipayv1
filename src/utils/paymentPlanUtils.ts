
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
  originalStatus?: string;
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
    paymentRequestId: installment.payment_request_id,
    originalStatus: installment.original_status || installment.status
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

/**
 * Group payment schedules by plan for legacy code compatibility
 */
export const groupPaymentSchedulesByPlan = (schedules: any[]): Map<string, any> => {
  const planMap = new Map();
  
  schedules.forEach(schedule => {
    const paymentLinkId = schedule.payment_link_id;
    
    if (!planMap.has(paymentLinkId)) {
      // Create a new plan entry
      planMap.set(paymentLinkId, {
        id: schedule.payment_link_id,
        patientId: schedule.patient_id,
        patientName: schedule.patients?.name || 'Unknown Patient',
        clinicId: schedule.clinic_id,
        title: schedule.payment_links?.title || 'Payment Plan',
        planName: schedule.payment_links?.title || 'Payment Plan',
        status: 'active', // Default status
        totalAmount: schedule.payment_links?.plan_total_amount || 0,
        amount: schedule.payment_links?.plan_total_amount || 0,
        installmentAmount: schedule.amount,
        totalInstallments: schedule.total_payments,
        paidInstallments: 0,
        progress: 0,
        paymentFrequency: schedule.payment_frequency,
        startDate: null,
        nextDueDate: null,
        hasOverduePayments: false,
        schedule: []
      });
    }
    
    // Add this installment to the plan's schedule
    const plan = planMap.get(paymentLinkId);
    plan.schedule.push(schedule);
    
    // Update plan properties based on installment data
    if (schedule.status === 'paid') {
      plan.paidInstallments += 1;
    }
    
    // Set the start date to the earliest due date
    if (!plan.startDate || new Date(schedule.due_date) < new Date(plan.startDate)) {
      plan.startDate = schedule.due_date;
    }
    
    // Set next due date to the earliest unpaid date
    if (schedule.status !== 'paid') {
      if (!plan.nextDueDate || new Date(schedule.due_date) < new Date(plan.nextDueDate)) {
        plan.nextDueDate = schedule.due_date;
      }
      
      // Check if this installment is overdue
      const now = new Date();
      if (new Date(schedule.due_date) < now) {
        plan.hasOverduePayments = true;
      }
    }
  });
  
  // Calculate progress percentage for each plan
  planMap.forEach(plan => {
    if (plan.totalInstallments > 0) {
      plan.progress = Math.round((plan.paidInstallments / plan.totalInstallments) * 100);
    }
  });
  
  return planMap;
};
