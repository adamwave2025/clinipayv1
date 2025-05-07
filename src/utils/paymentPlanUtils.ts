// Add or update PlanInstallment interface to include originalStatus
export interface PlanInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string;
  originalStatus?: string; // Add this property to track original status before pausing
}
