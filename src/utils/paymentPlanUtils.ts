
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
  created_at?: string; // Add created_at to help distinguish between plan instances
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
  createdAt?: string; // Add created_at to help identify when the plan was created
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
  // First, group by patient_id, payment_link_id, and initial created_at date
  // This ensures that each "plan instance" (even with same patient and payment link) is treated separately
  const groupedByCreationBatch = new Map<string, PaymentScheduleItem[]>();
  
  // Sort items by created_at to ensure we process older items first
  const sortedItems = [...scheduleItems].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });
  
  // Group items by their creation batch
  sortedItems.forEach(item => {
    // Get all items from the same plan batch based on patient_id, payment_link_id, and status
    // For cancelled plans, consider them as separate entities
    let existingBatchKey: string | null = null;
    
    for (const [key, batch] of groupedByCreationBatch.entries()) {
      if (batch[0].patient_id === item.patient_id && 
          batch[0].payment_link_id === item.payment_link_id) {
        
        // Check if any item in this batch is cancelled - if so, this is a separate plan instance
        const batchIsCancelled = batch.some(entry => entry.status === 'cancelled');
        const itemIsCancelled = item.status === 'cancelled';
        
        // If either the batch or the item is cancelled but not both, they should be separate
        // If neither is cancelled, they should be grouped together
        // If both are cancelled, check if they were likely part of the same plan
        if ((!batchIsCancelled && !itemIsCancelled) || 
            (batchIsCancelled && itemIsCancelled)) {
          existingBatchKey = key;
          break;
        }
      }
    }
    
    // If we found a matching batch, add to it, otherwise create a new batch
    if (existingBatchKey) {
      const existingBatch = groupedByCreationBatch.get(existingBatchKey)!;
      existingBatch.push(item);
    } else {
      // Create a unique key for this new plan instance
      const newBatchKey = `${item.patient_id}_${item.payment_link_id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      groupedByCreationBatch.set(newBatchKey, [item]);
    }
  });
  
  // Now convert the grouped batches into Plan objects
  const plansByPatient = new Map<string, Plan>();
  
  for (const [batchKey, batchItems] of groupedByCreationBatch.entries()) {
    // Take the first item as reference for the plan
    const firstItem = batchItems[0];
    
    // Create a plan for this batch
    const plan: Plan = {
      id: batchKey, // Use the unique batch key as the plan ID
      patientId: firstItem.patient_id,
      patientName: firstItem.patients?.name || 'Unknown Patient',
      planName: firstItem.payment_links?.title || 'Payment Plan',
      amount: firstItem.payment_links?.plan_total_amount || 0,
      totalInstallments: firstItem.total_payments,
      paidInstallments: 0,
      progress: 0,
      status: 'active',
      nextDueDate: null,
      schedule: [],
      hasOverduePayments: false,
      createdAt: firstItem.created_at
    };
    
    // Process each item in the batch
    for (const item of batchItems) {
      // Check if this installment is overdue - normalize date comparisons
      const dueDate = parseISO(item.due_date);
      // Reset time to start of day to ensure fair comparison
      const dueDateStart = startOfDay(dueDate);
      const now = startOfDay(new Date()); // Also normalize current date to start of day
      
      // Consider 'pending', 'processed', and 'sent' status for overdue check
      // Only mark as overdue if the due date is BEFORE today (not equal to today)
      const isOverdue = (item.status === 'pending' || item.status === 'processed' || item.status === 'sent') && 
                        dueDateStart < now && 
                        !isPlanInstallmentPaid(item);
      
      if (isOverdue) {
        plan.hasOverduePayments = true;
      }
      
      plan.schedule.push({
        id: item.id,
        dueDate: item.due_date,
        amount: item.amount,
        status: item.status,
        paymentNumber: item.payment_number,
        totalPayments: item.total_payments,
        paymentRequestId: item.payment_request_id,
        requestStatus: item.payment_requests?.status,
        isOverdue: isOverdue,
        isPaid: isPlanInstallmentPaid(item)
      });
      
      // Count paid installments using the consistent isPlanInstallmentPaid helper
      if (isPlanInstallmentPaid(item)) {
        plan.paidInstallments += 1;
      }
    }
    
    // Calculate progress and determine status for each plan
    // Calculate progress percentage
    plan.progress = Math.round((plan.paidInstallments / plan.totalInstallments) * 100);
    
    // Sort schedule by due date
    plan.schedule.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    // Check if ANY payment in the schedule is cancelled
    const hasCancelledPayment = plan.schedule.some(item => item.status === 'cancelled');
    
    // Check if ANY payment is paused
    const hasPausedPayment = plan.schedule.some(item => item.status === 'paused');
    
    // Determine plan status based on priority:
    if (hasCancelledPayment) {
      plan.status = 'cancelled';
    } else if (hasPausedPayment) {
      plan.status = 'paused';
    } else if (plan.hasOverduePayments) {
      plan.status = 'overdue';
    } else if (plan.progress === 100) {
      plan.status = 'completed';
    } else if (plan.paidInstallments === 0) {
      plan.status = 'pending';
    } else {
      plan.status = 'active';
    }
    
    // Find the next due date (first non-paid, non-cancelled, non-paused installment)
    const upcoming = plan.schedule.find(entry => 
      !entry.isPaid && entry.status !== 'cancelled' && entry.status !== 'paused');
    
    plan.nextDueDate = upcoming ? upcoming.dueDate : null;
    
    console.log(`Plan ${plan.planName} status: ${plan.status}, next due date: ${plan.nextDueDate}`);
    
    // Add the plan to our final map
    plansByPatient.set(plan.id, plan);
  }
  
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

