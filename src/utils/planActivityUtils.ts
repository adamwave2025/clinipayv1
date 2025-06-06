
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
  type?: string; // Added this for compatibility with existing code
  description?: string; // Added this for compatibility with existing code
  timestamp?: string; // Added this for compatibility with existing code
  performedAt: string;
  performedByUserId?: string;
  details?: {
    installmentId?: string;
    paymentNumber?: number;
    totalPayments?: number;
    amount?: number;
    originalDate?: string;
    newDate?: string;
    planName?: string;
    frequency?: string;
    totalAmount?: number;
    installmentAmount?: number;
    startDate?: string;
    nextDueDate?: string;
    resumeDate?: string;
    reference?: string;
    reason?: string;
    oldStartDate?: string;
    newStartDate?: string;
    oldDueDate?: string;
    refundAmount?: number;
    originalAmount?: number;
    isFullRefund?: boolean;
    refundedAt?: string;
    manualPayment?: boolean;
    error?: string;
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
  if (!Array.isArray(activities)) {
    console.error('formatPlanActivities received invalid input:', activities);
    return [];
  }

  console.log('Raw activities before formatting:', activities);
  
  const formattedActivities = activities.map(activity => {
    const formatted = {
      id: activity.id,
      planId: activity.plan_id,
      clinicId: activity.clinic_id,
      patientId: activity.patient_id,
      paymentLinkId: activity.payment_link_id,
      actionType: activity.action_type,
      type: activity.action_type, // Map actionType to type for compatibility
      description: activity.description || '', // Add description field
      timestamp: activity.performed_at, // Map performedAt to timestamp for compatibility
      performedAt: activity.performed_at,
      performedByUserId: activity.performed_by_user_id,
      details: enrichActivityDetails(activity.action_type, activity.details || {})
    };
    
    console.log(`Formatted activity ${activity.id} (${activity.action_type}):`, formatted);
    return formatted;
  });
  
  // Sort activities by performed_at date in descending order (newest first)
  return formattedActivities.sort((a, b) => {
    const dateA = new Date(a.performedAt || a.timestamp || '').getTime();
    const dateB = new Date(b.performedAt || b.timestamp || '').getTime();
    return dateB - dateA;
  });
};

/**
 * Enhance activity details with additional useful information based on activity type
 */
const enrichActivityDetails = (actionType: string, details: any): any => {
  // Clone the details to avoid modifying the original
  const enhancedDetails = { ...details };
  
  console.log(`Enriching details for ${actionType}:`, enhancedDetails);
  
  // For plan creation, ensure we have all required fields
  if (actionType === 'plan_created') {
    // Map the database column names to the UI expected field names
    
    // Plan name mapping
    if (!enhancedDetails.planName && enhancedDetails.title) {
      enhancedDetails.planName = enhancedDetails.title;
    }
    
    // For total amount, check multiple possible field names
    if (!enhancedDetails.totalAmount) {
      if (enhancedDetails.planTotalAmount) {
        enhancedDetails.totalAmount = enhancedDetails.planTotalAmount;
      } else if (enhancedDetails.total_amount) {
        enhancedDetails.totalAmount = enhancedDetails.total_amount;
      }
    }
    
    // For frequency, check multiple possible field names
    if (!enhancedDetails.frequency) {
      if (enhancedDetails.paymentFrequency) {
        enhancedDetails.frequency = enhancedDetails.paymentFrequency;
      } else if (enhancedDetails.payment_frequency) {
        enhancedDetails.frequency = enhancedDetails.payment_frequency;
      }
    }
    
    // For installment amount, check multiple possible field names
    if (!enhancedDetails.installmentAmount) {
      if (enhancedDetails.paymentAmount) {
        enhancedDetails.installmentAmount = enhancedDetails.paymentAmount;
      } else if (enhancedDetails.installment_amount) {
        enhancedDetails.installmentAmount = enhancedDetails.installment_amount;
      }
    }
    
    // For start date, check multiple possible field names
    if (!enhancedDetails.startDate) {
      if (enhancedDetails.start_date) {
        enhancedDetails.startDate = enhancedDetails.start_date;
      }
    }
    
    // Log enhanced details for debugging
    console.log('Enriched plan_created details:', {
      planName: enhancedDetails.planName,
      totalAmount: enhancedDetails.totalAmount,
      frequency: enhancedDetails.frequency,
      installmentAmount: enhancedDetails.installmentAmount,
      startDate: enhancedDetails.startDate
    });
  }
  
  // For payments, ensure reference details are available
  if (actionType === 'payment_made' || actionType === 'payment_marked_paid') {
    // Format reference if it's not already formatted
    if (enhancedDetails.paymentRef && !enhancedDetails.reference) {
      enhancedDetails.reference = enhancedDetails.paymentRef;
    }
    
    // Ensure we have payment number and total
    // Check multiple possible field names for payment number
    if (!enhancedDetails.paymentNumber) {
      if (enhancedDetails.installmentNumber) {
        enhancedDetails.paymentNumber = enhancedDetails.installmentNumber;
      } else if (enhancedDetails.payment_number) {
        enhancedDetails.paymentNumber = enhancedDetails.payment_number;
      }
    }
    
    // Check multiple possible field names for total payments
    if (!enhancedDetails.totalPayments) {
      if (enhancedDetails.totalInstallments) {
        enhancedDetails.totalPayments = enhancedDetails.totalInstallments;
      } else if (enhancedDetails.total_installments) {
        enhancedDetails.totalPayments = enhancedDetails.total_installments;
      } else if (enhancedDetails.total_payments) {
        enhancedDetails.totalPayments = enhancedDetails.total_payments;
      }
    }
    
    // If we still don't have totalPayments but have planDetails
    if (!enhancedDetails.totalPayments && enhancedDetails.planDetails) {
      if (enhancedDetails.planDetails.totalInstallments) {
        enhancedDetails.totalPayments = enhancedDetails.planDetails.totalInstallments;
      } else if (enhancedDetails.planDetails.total_installments) {
        enhancedDetails.totalPayments = enhancedDetails.planDetails.total_installments;
      }
    }
    
    // Log enhanced payment details for debugging
    console.log('Enriched payment details:', {
      reference: enhancedDetails.reference,
      paymentNumber: enhancedDetails.paymentNumber,
      totalPayments: enhancedDetails.totalPayments,
      manualPayment: enhancedDetails.manualPayment
    });
  }
  
  // For plan actions, ensure we have plan name
  if (actionType.startsWith('plan_')) {
    if (!enhancedDetails.planName && enhancedDetails.title) {
      enhancedDetails.planName = enhancedDetails.title;
    }
    
    // For resumed plans, ensure we have next payment date
    if (actionType === 'plan_resumed') {
      // Check multiple possible field names for resume date
      if (!enhancedDetails.resumeDate) {
        if (enhancedDetails.nextDueDate) {
          enhancedDetails.resumeDate = enhancedDetails.nextDueDate;
        } else if (enhancedDetails.next_due_date) {
          enhancedDetails.resumeDate = enhancedDetails.next_due_date;
        } else if (enhancedDetails.nextPaymentDate) {
          enhancedDetails.resumeDate = enhancedDetails.nextPaymentDate;
        } else if (enhancedDetails.next_payment_date) {
          enhancedDetails.resumeDate = enhancedDetails.next_payment_date;
        }
      }
      
      // Make sure nextDueDate is also set for backwards compatibility
      if (enhancedDetails.resumeDate && !enhancedDetails.nextDueDate) {
        enhancedDetails.nextDueDate = enhancedDetails.resumeDate;
      }
      
      // Log enhanced resume details for debugging
      console.log('Enriched plan_resumed details:', {
        resumeDate: enhancedDetails.resumeDate,
        nextDueDate: enhancedDetails.nextDueDate
      });
    }
    
    // For rescheduled plans, ensure we have the date changes
    if (actionType === 'plan_rescheduled' || actionType === 'reschedule_plan') {
      // Normalize start date fields
      if (enhancedDetails.oldDate && !enhancedDetails.oldStartDate) {
        enhancedDetails.oldStartDate = enhancedDetails.oldDate;
      }
      if (enhancedDetails.newDate && !enhancedDetails.newStartDate) {
        enhancedDetails.newStartDate = enhancedDetails.newDate;
      }
      
      // Make sure we have a next due date for UI display
      if (enhancedDetails.newStartDate && !enhancedDetails.nextDueDate) {
        enhancedDetails.nextDueDate = enhancedDetails.newStartDate;
      }
    }
  }
  
  // For rescheduled payments
  if (actionType === 'payment_rescheduled' || actionType === 'reschedule_payment') {
    // Normalize date fields
    if (enhancedDetails.originalDate && !enhancedDetails.oldDueDate) {
      enhancedDetails.oldDueDate = enhancedDetails.originalDate;
    }
    if (!enhancedDetails.newDate && enhancedDetails.newDueDate) {
      enhancedDetails.newDate = enhancedDetails.newDueDate;
    }
  }
  
  // For refunds
  if (actionType === 'payment_refunded') {
    // Ensure we have all necessary fields
    if (enhancedDetails.refund_amount && !enhancedDetails.refundAmount) {
      enhancedDetails.refundAmount = enhancedDetails.refund_amount;
    }
    if (enhancedDetails.refunded_at && !enhancedDetails.refundedAt) {
      enhancedDetails.refundedAt = enhancedDetails.refunded_at;
    }
  }
  
  console.log(`Fully enriched details for ${actionType}:`, enhancedDetails);
  return enhancedDetails;
};

/**
 * Get a user-friendly label for an action type
 */
export const getActionTypeLabel = (actionType: string): string => {
  switch (actionType) {
    case 'plan_created':
      return 'Plan created';
    case 'payment_marked_paid':
      return 'Payment marked as paid';
    case 'payment_made':
      return 'Payment received';
    case 'payment_rescheduled':
    case 'reschedule_payment':
      return 'Payment rescheduled';
    case 'plan_paused':
      return 'Plan paused';
    case 'plan_resumed':
      return 'Plan resumed';
    case 'plan_rescheduled':
    case 'reschedule_plan':
      return 'Plan rescheduled';
    case 'plan_cancelled':
      return 'Plan cancelled';
    case 'payment_refunded':
      return 'Payment refunded';
    case 'payment_reminder_sent':
      return 'Payment reminder sent';
    case 'payment_failed':
      return 'Payment failed';
    default:
      return capitalize(actionType.replace(/_/g, ' '));
  }
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Check if a payment link is active and can be processed
 */
export const isPaymentLinkActive = (linkData?: any | null): boolean => {
  if (!linkData) {
    console.log('Payment link check: No link data provided');
    return false;
  }
  
  console.log('Main utils: Checking payment link status:', {
    id: linkData.id,
    status: linkData.status, 
    isActive: linkData.isActive,
    paymentPlan: linkData.paymentPlan
  });
  
  // First check for an explicit isActive property (from database is_active)
  if (linkData.isActive === false) {
    console.log(`Main utils: Payment link ${linkData.id} is explicitly marked as inactive`);
    return false;
  }
  
  // For status-based checks
  const activeStatuses = ['active', 'overdue', 'pending', 'sent'];
  
  if (activeStatuses.includes(linkData.status)) {
    console.log(`Main utils: Payment link ${linkData.id} has active status: ${linkData.status}`);
    return true;
  }
  
  // For payment plans with special handling
  if (linkData.paymentPlan) {
    // Payment plans can be processed if they are active or overdue
    if (linkData.status === 'active' || linkData.status === 'overdue') {
      console.log(`Main utils: Payment plan ${linkData.id} is processable with status: ${linkData.status}`);
      return true;
    }
    
    // All other statuses for payment plans are considered inactive
    console.log(`Main utils: Payment plan ${linkData.id} is not processable with status: ${linkData.status}`);
    return false;
  }
  
  // If we have no clear indication that it's inactive, assume it's active
  // This is a fallback to prevent false negatives
  console.log(`Main utils: Payment link ${linkData.id} status check defaulting to: ${linkData.status === 'cancelled' ? 'inactive' : 'active'}`);
  return linkData.status !== 'cancelled';
};
