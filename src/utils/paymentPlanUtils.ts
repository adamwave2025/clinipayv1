
import { format, parseISO, isAfter } from 'date-fns';

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
  status: 'active' | 'pending' | 'completed' | 'overdue' | 'cancelled';
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
    
    // Check if this installment is overdue
    const dueDate = new Date(entry.due_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    
    // Consider 'pending', 'processed', and 'sent' status for overdue check
    const isOverdue = (entry.status === 'pending' || entry.status === 'processed' || entry.status === 'sent') && 
                     dueDate < now && 
                     !entry.payment_requests?.payment_id;
    
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
      isOverdue: isOverdue
    });
    
    // Count paid installments
    const isPaid = (entry.status === 'sent' && entry.payment_requests?.payment_id) || 
                   entry.payment_requests?.status === 'paid';
    if (isPaid) {
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
    // This is the key change - we now consider a plan cancelled if ANY payment is cancelled
    const hasCancelledPayment = plan.schedule.some(item => item.status === 'cancelled');
    
    // Determine plan status based on priority:
    // 1. First check if any payment is cancelled (new logic)
    if (hasCancelledPayment) {
      plan.status = 'cancelled';
    }
    // 2. Then check for overdue payments
    else if (plan.hasOverduePayments) {
      plan.status = 'overdue';
    }
    // 3. Then check if it's completed
    else if (plan.progress === 100) {
      plan.status = 'completed';
    }
    // 4. Then check if it's pending (no payments made)
    else if (plan.paidInstallments === 0) {
      plan.status = 'pending';
    }
    // 5. Otherwise it's active
    else {
      plan.status = 'active';
    }
    
    // Find the next due date (first non-paid, non-cancelled installment)
    const upcoming = plan.schedule.find(entry => 
      entry.status !== 'paid' && entry.status !== 'cancelled');
    plan.nextDueDate = upcoming ? upcoming.dueDate : null;
  });
  
  return plansByPatient;
};

export const formatPlanInstallments = (installmentData: any[]): PlanInstallment[] => {
  return installmentData.map(item => {
    const dueDate = format(parseISO(item.due_date), 'yyyy-MM-dd');
    const paidDate = item.payment_requests?.paid_at 
      ? format(parseISO(item.payment_requests.paid_at), 'yyyy-MM-dd')
      : null;
      
    // Determine status accurately
    const now = new Date();
    const due = parseISO(item.due_date);
    const isPaid = item.payment_requests?.payment_id || item.payment_requests?.status === 'paid';
    
    let status;
    
    if (isPaid) {
      status = 'paid';
    } else if (item.status === 'cancelled') {
      status = 'cancelled';
    } else if (item.status === 'sent' || item.status === 'processed') {
      // If sent/processed but due date has passed, mark as overdue
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
