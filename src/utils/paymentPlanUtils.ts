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
  paymentId?: string;
  manualPayment?: boolean;
}

/**
 * Format payment schedule data from the database for frontend display
 */
export const formatPlanInstallments = (scheduleData: any[]): PlanInstallment[] => {
  console.log('formatPlanInstallments called with:', scheduleData?.length || 0, 'items');
  
  if (!Array.isArray(scheduleData)) {
    console.error('Invalid data passed to formatPlanInstallments:', scheduleData);
    return [];
  }
  
  try {
    const installments = scheduleData.map(item => {
      // Log each item's structure for debugging
      console.log(`Processing installment ${item.id}:`, {
        status: item.status,
        payment: item.payment || "No payment",
        manualPayment: item.manualPayment,
        paidDate: item.paidDate
      });
      
      // Create the installment object with default values
      const installment: PlanInstallment = {
        id: item.id,
        planId: item.plan_id,
        paymentNumber: item.payment_number,
        totalPayments: item.total_payments,
        amount: item.amount,
        dueDate: item.due_date,
        status: item.status,
        paidDate: item.paidDate || null, // Use the paidDate we added in the service
        paymentRequestId: item.payment_request_id,
        originalStatus: item.status,
        manualPayment: !!item.manualPayment // Use the manualPayment flag we added
      };
      
      // If payment exists, add its ID
      if (item.payment) {
        installment.paymentId = item.payment.id;
      }
      
      return installment;
    });
    
    console.log(`Formatted ${installments.length} installments:`, installments);
    return installments;
  } catch (error) {
    console.error('Error formatting plan installments:', error);
    return [];
  }
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
