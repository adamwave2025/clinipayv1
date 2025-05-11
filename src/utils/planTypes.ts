
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
}
