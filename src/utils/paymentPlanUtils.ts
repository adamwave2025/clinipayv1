
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { Plan } from './planTypes';

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
  plan_id?: string; // Added to link schedule entries to plans
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
  planId?: string;
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

/**
 * Find the next unpaid due date from a list of schedule entries
 * Returns the earliest unpaid due date, or null if all are paid
 */
const findNextDueDate = (entries: PaymentScheduleItem[]): string | null => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const unpaidEntries = entries
    .filter(entry => !isPlanInstallmentPaid(entry))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    
  return unpaidEntries.length > 0 ? unpaidEntries[0].due_date : null;
};

/**
 * Group payment schedules by plan
 * This is for backwards compatibility with code that still uses the old grouping method
 * 
 * NOTE: The database stores monetary values in cents (1/100 of currency unit)
 * So we need to divide by 100 when formatting amounts for display
 */
export const groupPaymentSchedulesByPlan = (scheduleData: PaymentScheduleItem[]): Map<string, Plan> => {
  const plans = new Map<string, Plan>();
  
  // First try to group by plan_id if available
  const planGroups = new Map<string, PaymentScheduleItem[]>();
  scheduleData.forEach(entry => {
    if (entry.plan_id) {
      const items = planGroups.get(entry.plan_id) || [];
      items.push(entry);
      planGroups.set(entry.plan_id, items);
    }
  });
  
  // Process existing plan IDs first
  planGroups.forEach((entries, planId) => {
    if (entries.length === 0) return;
    
    const firstEntry = entries[0];
    const plan: Plan = {
      id: planId,
      patientId: firstEntry.patient_id || '',
      patientName: firstEntry.patients?.name || 'Unknown Patient',
      clinicId: '', // Will be set from the patient record if needed
      paymentLinkId: firstEntry.payment_link_id,
      title: firstEntry.payment_links?.title || 'Payment Plan',
      status: 'pending',
      totalAmount: 0,
      installmentAmount: (firstEntry.amount || 0) / 100, // Convert cents to standard currency units
      totalInstallments: firstEntry.total_payments || 0,
      paidInstallments: 0,
      progress: 0,
      paymentFrequency: '',
      startDate: '',
      nextDueDate: null,
      hasOverduePayments: false,
      // Backward compatibility fields
      planName: firstEntry.payment_links?.title || 'Payment Plan',
      amount: 0
    };
    
    // Process entries for this plan
    entries.forEach(entry => {
      // Calculate first payment and next due date
      if (!plan.startDate || new Date(entry.due_date) < new Date(plan.startDate)) {
        plan.startDate = entry.due_date;
      }
      
      // Count paid installments and update status
      if (isPlanInstallmentPaid(entry)) {
        plan.paidInstallments++;
      }
    });
    
    // Find next due date from the unpaid entries
    plan.nextDueDate = findNextDueDate(entries);
    
    // Check for overdue payments - FIX: Use startOfDay for accurate comparison
    const now = startOfDay(new Date());
    const hasOverdue = entries.some(e => 
      !isPlanInstallmentPaid(e) && 
      startOfDay(new Date(e.due_date)) < now
    );
    plan.hasOverduePayments = hasOverdue;
    
    // Update plan status
    if (entries.some(e => e.status === 'cancelled')) {
      plan.status = 'cancelled';
    } else if (entries.some(e => e.status === 'paused')) {
      plan.status = 'paused';
    } else if (plan.hasOverduePayments) {
      plan.status = 'overdue';
    } else if (plan.paidInstallments > 0) {
      plan.status = 'active';
    }
    
    // Update total amount if available from payment_links
    if (firstEntry.payment_links?.plan_total_amount) {
      plan.totalAmount = firstEntry.payment_links.plan_total_amount / 100; // Convert cents to standard currency units
      plan.amount = firstEntry.payment_links.plan_total_amount / 100; // For backwards compatibility
    } else {
      plan.totalAmount = ((firstEntry.amount || 0) * (firstEntry.total_payments || 1)) / 100; // Convert cents to standard currency units
      plan.amount = ((firstEntry.amount || 0) * (firstEntry.total_payments || 1)) / 100; // For backwards compatibility
    }
    
    // Update progress
    plan.progress = Math.floor((plan.paidInstallments / plan.totalInstallments) * 100) || 0;
    
    // If all installments are paid, mark as completed
    if (plan.paidInstallments === plan.totalInstallments) {
      plan.status = 'completed';
    }
    
    // Update the plan in the map
    plans.set(planId, plan);
  });
  
  // Handle legacy entries without plan_id (backward compatibility)
  scheduleData.forEach(entry => {
    // Skip entries without patient_id or payment_link_id or if already processed with plan_id
    if (!entry.patient_id || !entry.payment_link_id || entry.plan_id) return;
    
    // Create a unique key for this plan
    const legacyPlanId = `${entry.patient_id}_${entry.payment_link_id}`;
    
    // Skip if we already have this plan from plan_id grouping
    if (plans.has(legacyPlanId)) return;
    
    // Get existing plan or create a new one
    let plan = plans.get(legacyPlanId) || {
      id: legacyPlanId,
      patientId: entry.patient_id,
      patientName: entry.patients?.name || 'Unknown Patient',
      clinicId: '', // Will be set from the patient record if needed
      paymentLinkId: entry.payment_link_id,
      title: entry.payment_links?.title || 'Payment Plan',
      status: 'pending',
      totalAmount: 0,
      installmentAmount: (entry.amount || 0) / 100, // Convert cents to standard currency units
      totalInstallments: entry.total_payments || 0,
      paidInstallments: 0,
      progress: 0,
      paymentFrequency: '',
      startDate: '',
      nextDueDate: null,
      hasOverduePayments: false,
      // Backward compatibility fields
      planName: entry.payment_links?.title || 'Payment Plan',
      amount: 0
    };
    
    // Calculate first payment and next due date
    if (!plan.startDate || new Date(entry.due_date) < new Date(plan.startDate)) {
      plan.startDate = entry.due_date;
    }
    
    // Count paid installments and update status
    if (isPlanInstallmentPaid(entry)) {
      plan.paidInstallments++;
    }
    
    // Get next unpaid due date
    if (!isPlanInstallmentPaid(entry) && (!plan.nextDueDate || new Date(entry.due_date) < new Date(plan.nextDueDate))) {
      plan.nextDueDate = entry.due_date;
    }
    
    // Check for overdue payments - FIX: Use startOfDay for accurate comparison
    const now = startOfDay(new Date());
    if (!isPlanInstallmentPaid(entry) && startOfDay(new Date(entry.due_date)) < now) {
      plan.hasOverduePayments = true;
    }
    
    // Update plan status
    if (entry.status === 'cancelled') {
      plan.status = 'cancelled';
    } else if (entry.status === 'paused') {
      plan.status = 'paused';
    } else if (plan.hasOverduePayments) {
      plan.status = 'overdue';
    } else if (plan.paidInstallments > 0) {
      plan.status = 'active';
    }
    
    // Update total amount if available from payment_links
    if (entry.payment_links?.plan_total_amount) {
      plan.totalAmount = entry.payment_links.plan_total_amount / 100; // Convert cents to standard currency units
      plan.amount = entry.payment_links.plan_total_amount / 100; // For backwards compatibility
    } else {
      plan.totalAmount = ((entry.amount || 0) * (entry.total_payments || 1)) / 100; // Convert cents to standard currency units
      plan.amount = ((entry.amount || 0) * (entry.total_payments || 1)) / 100; // For backwards compatibility
    }
    
    // Update progress
    plan.progress = Math.floor((plan.paidInstallments / plan.totalInstallments) * 100) || 0;
    
    // If all installments are paid, mark as completed
    if (plan.paidInstallments === plan.totalInstallments) {
      plan.status = 'completed';
    }
    
    // Update the plan in the map
    plans.set(legacyPlanId, plan);
  });
  
  return plans;
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
      amount: (item.amount || 0) / 100, // Convert cents to standard currency units
      status,
      paidDate,
      paymentNumber: item.payment_number,
      totalPayments: item.total_payments,
      paymentRequestId: item.payment_request_id,
      planId: item.plan_id
    };
  });
};
