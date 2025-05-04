
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

export interface Plan {
  id: string;
  patientId: string;
  patientName: string;
  planName: string;
  amount: number;
  totalInstallments: number;
  paidInstallments: number;
  progress: number;
  status: 'active' | 'pending' | 'completed' | 'overdue' | 'cancelled' | 'paused';
  nextDueDate: string | null;
  schedule: any[];
  hasOverduePayments: boolean;
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
  
  if (isPaid) {
    console.log(`Installment ${entry.id} (payment ${entry.payment_number}) is considered paid`);
  }
  
  return isPaid;
};

export const groupPaymentSchedulesByPlan = (scheduleItems: PaymentScheduleItem[]): Map<string, Plan> => {
  const plansByPatient = new Map<string, Plan>();
  
  scheduleItems.forEach(entry => {
    // Create a unique key for each patient's plan
    const planKey = `${entry.patient_id || 'unknown'}_${entry.payment_link_id}`;
    
    if (!plansByPatient.has(planKey)) {
      // Initialize plan data
      plansByPatient.set(planKey, {
        id: planKey,
        patientId: entry.patient_id,
        patientName: entry.patients?.name || 'Unknown Patient',
        planName: entry.payment_links?.title || 'Payment Plan',
        amount: entry.payment_links?.plan_total_amount || 0,
        totalInstallments: entry.total_payments,
        paidInstallments: 0,
        progress: 0,
        status: 'active',
        nextDueDate: null,
        schedule: [],
        hasOverduePayments: false
      });
    }
    
    // Add this entry to the plan's schedule
    const plan = plansByPatient.get(planKey)!;
    
    // Check if this installment is overdue - FIXED: normalize date comparisons
    const dueDate = parseISO(entry.due_date);
    // Reset time to start of day to ensure fair comparison
    const dueDateStart = startOfDay(dueDate);
    const now = startOfDay(new Date()); // Also normalize current date to start of day
    
    // Consider 'pending', 'processed', and 'sent' status for overdue check
    // Only mark as overdue if the due date is BEFORE today (not equal to today)
    const isOverdue = (entry.status === 'pending' || entry.status === 'processed' || entry.status === 'sent') && 
                     dueDateStart < now && 
                     !isPlanInstallmentPaid(entry);
    
    if (isOverdue) {
      plan.hasOverduePayments = true;
    }
    
    plan.schedule.push({
      id: entry.id,
      dueDate: entry.due_date,
      amount: entry.amount,
      status: entry.status,
      paymentNumber: entry.payment_number,
      totalPayments: entry.total_payments,
      paymentRequestId: entry.payment_request_id,
      requestStatus: entry.payment_requests?.status,
      isOverdue: isOverdue,
      isPaid: isPlanInstallmentPaid(entry)
    });
    
    // Count paid installments using the consistent isPlanInstallmentPaid helper
    if (isPlanInstallmentPaid(entry)) {
      plan.paidInstallments += 1;
    }
  });
  
  // Calculate progress and determine status for each plan
  plansByPatient.forEach(plan => {
    // Calculate progress percentage
    plan.progress = Math.round((plan.paidInstallments / plan.totalInstallments) * 100);
    
    // Sort schedule by due date
    plan.schedule.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    // Check if ANY payment in the schedule is cancelled
    const hasCancelledPayment = plan.schedule.some(item => item.status === 'cancelled');
    
    // Check if ANY payment is paused (new logic)
    const hasPausedPayment = plan.schedule.some(item => item.status === 'paused');
    
    // Determine plan status based on priority:
    // 1. First check if any payment is cancelled
    if (hasCancelledPayment) {
      plan.status = 'cancelled';
    }
    // 2. Check if any payment is paused (new logic)
    else if (hasPausedPayment) {
      plan.status = 'paused';
    } 
    // 3. Then check for overdue payments
    else if (plan.hasOverduePayments) {
      plan.status = 'overdue';
    }
    // 4. Then check if it's completed
    else if (plan.progress === 100) {
      plan.status = 'completed';
    }
    // 5. Then check if it's pending (no payments made)
    else if (plan.paidInstallments === 0) {
      plan.status = 'pending';
    }
    // 6. Otherwise it's active
    else {
      plan.status = 'active';
    }
    
    // Find the next due date (first non-paid, non-cancelled, non-paused installment)
    // Using our consistent payment check instead of just status
    const upcoming = plan.schedule.find(entry => 
      !entry.isPaid && entry.status !== 'cancelled' && entry.status !== 'paused');
    
    plan.nextDueDate = upcoming ? upcoming.dueDate : null;
    
    console.log(`Plan ${plan.planName} status: ${plan.status}, next due date: ${plan.nextDueDate}`);
  });
  
  return plansByPatient;
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

