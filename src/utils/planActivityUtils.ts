
/**
 * Interface for plan activity entries
 */
export interface PlanActivity {
  id: string;
  planId: string;
  clinicId: string;
  patientId: string;
  paymentLinkId: string;
  actionType: string;
  performedAt: string;
  performedByUserId?: string;
  details?: {
    installmentId?: string;
    paymentNumber?: number;
    amount?: number;
    originalDate?: string;
    newDate?: string;
    [key: string]: any;
  };
}

/**
 * Format activities from the database into frontend format
 * 
 * @param activities Raw activity data from the database
 * @returns Formatted activities for frontend use
 */
export const formatPlanActivities = (activities: any[]): PlanActivity[] => {
  return activities.map(activity => ({
    id: activity.id,
    planId: activity.plan_id,
    clinicId: activity.clinic_id,
    patientId: activity.patient_id,
    paymentLinkId: activity.payment_link_id,
    actionType: activity.action_type,
    performedAt: activity.performed_at,
    performedByUserId: activity.performed_by_user_id,
    details: activity.details || {}
  }));
};
