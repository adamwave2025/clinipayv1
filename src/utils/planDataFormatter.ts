
import { Plan } from './planTypes';

/**
 * Formats raw plan data from the database into a structured Plan object
 */
export const formatPlanFromDb = (planData: any): Plan => {
  // Extract patient information if available
  const patientName = planData.patients?.name || '';
  const patientEmail = planData.patients?.email || '';

  return {
    id: planData.id,
    patientId: planData.patient_id,
    patientName,
    patientEmail,
    patients: planData.patients,
    clinicId: planData.clinic_id,
    paymentLinkId: planData.payment_link_id,
    title: planData.title || 'Payment Plan',
    description: planData.description || '',
    totalAmount: planData.total_amount || 0,
    installmentAmount: planData.installment_amount || 0,
    totalInstallments: planData.total_installments || 0,
    paidInstallments: planData.paid_installments || 0,
    startDate: planData.start_date,
    nextDueDate: planData.next_due_date,
    status: planData.status || 'pending',
    progress: planData.progress || 0,
    createdAt: planData.created_at,
    updatedAt: planData.updated_at,
    paymentFrequency: planData.payment_frequency
  };
};
