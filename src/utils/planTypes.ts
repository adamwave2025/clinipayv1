
// Define a proper Plan type mapped to our database schema
export interface Plan {
  id: string;
  patientId: string;
  patientName: string;
  clinicId: string;
  paymentLinkId: string;
  title: string;
  description?: string;
  status: 'active' | 'pending' | 'completed' | 'overdue' | 'cancelled' | 'paused';
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  progress: number;
  paymentFrequency: string;
  startDate: string;
  nextDueDate: string | null;
  hasOverduePayments: boolean;
  createdAt?: string;
  updatedAt?: string;
  schedule?: any[];
  // Backward compatibility properties
  planName?: string;
  amount?: number;
}

// Keep the existing PlanInstallment type for consistency
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
 * Helper function to format a plan from the database into our frontend format
 * 
 * IMPORTANT: The database stores monetary values in cents (1/100 of currency unit)
 * We keep amounts in pence/cents here because formatCurrency() will handle the conversion
 * 
 * @param dbPlan - Raw plan data from database
 * @returns Formatted Plan object with amounts still in pence/cents
 */
export const formatPlanFromDb = (dbPlan: any): Plan => {
  // If the plan comes directly from the plans table
  if ('patient_id' in dbPlan) {
    return {
      id: dbPlan.id,
      patientId: dbPlan.patient_id,
      patientName: dbPlan.patients?.name || 'Unknown Patient',
      clinicId: dbPlan.clinic_id,
      paymentLinkId: dbPlan.payment_link_id,
      title: dbPlan.title || 'Payment Plan',
      description: dbPlan.description || '',
      status: dbPlan.status,
      totalAmount: dbPlan.total_amount || 0, // Keep in pence, do not divide by 100
      installmentAmount: dbPlan.installment_amount || 0, // Keep in pence, do not divide by 100
      totalInstallments: dbPlan.total_installments,
      paidInstallments: dbPlan.paid_installments || 0,
      progress: dbPlan.progress || 0,
      paymentFrequency: dbPlan.payment_frequency,
      startDate: dbPlan.start_date,
      nextDueDate: dbPlan.next_due_date || null,
      hasOverduePayments: dbPlan.has_overdue_payments || false,
      createdAt: dbPlan.created_at,
      updatedAt: dbPlan.updated_at,
      // Set backward compatibility fields
      planName: dbPlan.title || 'Payment Plan',
      amount: dbPlan.total_amount || 0 // Keep in pence, do not divide by 100
    };
  }
  
  // Otherwise use the original formatting logic
  return {
    id: dbPlan.id,
    patientId: dbPlan.patient_id,
    patientName: dbPlan.patient_name || 'Unknown Patient',
    clinicId: dbPlan.clinic_id,
    paymentLinkId: dbPlan.payment_link_id,
    title: dbPlan.title || 'Payment Plan',
    description: dbPlan.description || '',
    status: dbPlan.status,
    totalAmount: dbPlan.total_amount || 0, // Keep in pence, do not divide by 100
    installmentAmount: dbPlan.installment_amount || 0, // Keep in pence, do not divide by 100
    totalInstallments: dbPlan.total_installments,
    paidInstallments: dbPlan.paid_installments || 0,
    progress: dbPlan.progress || 0,
    paymentFrequency: dbPlan.payment_frequency,
    startDate: dbPlan.start_date,
    nextDueDate: dbPlan.next_due_date || null,
    hasOverduePayments: dbPlan.has_overdue_payments || false,
    createdAt: dbPlan.created_at,
    updatedAt: dbPlan.updated_at,
    // Set backward compatibility fields
    planName: dbPlan.title || 'Payment Plan',
    amount: dbPlan.total_amount || 0 // Keep in pence, do not divide by 100
  };
};
