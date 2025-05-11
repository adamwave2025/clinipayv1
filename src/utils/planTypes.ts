export interface Plan {
  id: string;
  clinicId: string;
  patientId: string;
  patientName?: string;
  paymentLinkId: string;
  title: string;
  description?: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  progress: number;
  paymentFrequency: string;
  startDate: string;
  nextDueDate?: string;
  status: 'active' | 'pending' | 'paused' | 'cancelled' | 'completed' | 'overdue';
  createdAt: string;
  updatedAt: string;
  
  // Add these properties that are being referenced in the codebase
  planName?: string; // Alias for title for backward compatibility
  amount?: number;   // Alias for totalAmount for backward compatibility
  patients?: { 
    id?: string;
    name?: string;
    email?: string;
  };
  manualPayment?: boolean; // Add the missing manualPayment property
}

/**
 * Format raw plan data from the database into the frontend Plan interface
 */
export const formatPlanFromDb = (planData: any): Plan => {
  return {
    id: planData.id,
    clinicId: planData.clinic_id,
    patientId: planData.patient_id,
    patientName: planData.patients?.name || '',
    paymentLinkId: planData.payment_link_id,
    title: planData.title || planData.payment_links?.title || 'Payment Plan',
    description: planData.description,
    totalAmount: planData.total_amount || planData.payment_links?.plan_total_amount || 0,
    installmentAmount: planData.installment_amount || planData.amount || 0,
    totalInstallments: planData.total_installments || 0,
    paidInstallments: planData.paid_installments || 0,
    progress: planData.progress || 0,
    paymentFrequency: planData.payment_frequency || planData.payment_links?.payment_cycle || 'monthly',
    startDate: planData.start_date,
    nextDueDate: planData.next_due_date,
    status: planData.status || 'pending',
    createdAt: planData.created_at,
    updatedAt: planData.updated_at,
    
    // Set backward compatibility fields
    planName: planData.title || planData.payment_links?.title || 'Payment Plan',
    amount: planData.total_amount || planData.payment_links?.plan_total_amount || 0,
    
    // Keep patients reference for backward compatibility
    patients: planData.patients,
    
    // Add manualPayment property
    manualPayment: planData.manual_payment || false
  };
};
