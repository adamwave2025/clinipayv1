

import React from 'react';
import { formatDate, formatCurrency, formatDateTime } from '@/utils/formatters';
import StatusBadge from '@/components/common/StatusBadge';
import { getActionTypeLabel } from '@/utils/planActivityUtils';
import { 
  CreditCard, 
  Calendar, 
  Pause, 
  Play, 
  X, 
  Clock, 
  CheckCircle, 
  Mail,
  RefreshCcw
} from 'lucide-react';

interface PatientActivityProps {
  payments: any[];
  planActivities: any[];
}

const PatientActivity: React.FC<PatientActivityProps> = ({ payments, planActivities }) => {
  // Helper function to ensure consistent date parsing with timezone awareness
  const getDateTimestamp = (dateString: string): number => {
    if (!dateString) return 0;
    // Use ISO string to ensure consistent parsing across browsers
    // The Z at the end ensures UTC timezone for consistency
    const ensureUTCFormat = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    try {
      return new Date(dateString).getTime();
    } catch (e) {
      console.error('Invalid date format:', dateString, e);
      return 0;
    }
  };

  // Combine and sort all activities by date (newest first)
  const allActivities = [
    ...payments.map(payment => ({
      ...payment,
      type: 'payment',
      date: payment.date
    })),
    ...planActivities.map(activity => ({
      ...activity,
      type: 'plan_activity',
      date: activity.performedAt
    }))
  ].sort((a, b) => {
    // Use our helper function to get timestamps consistently
    const dateA = getDateTimestamp(a.date);
    const dateB = getDateTimestamp(b.date);
    
    console.log(`Comparing dates: ${a.date} (${new Date(a.date).toISOString()}) vs ${b.date} (${new Date(b.date).toISOString()})`);
    console.log(`Timestamps: ${dateA} vs ${dateB}`);
    
    return dateB - dateA; // Newest first
  });
  
  console.log('All sorted activities:', allActivities);

  const getActivityIcon = (activity: any) => {
    if (activity.type === 'payment') {
      // Keep payment icons as purple to distinguish them from plan activities
      return <CreditCard className="h-4 w-4 text-clinipay-purple" />;
    } else {
      // Plan activity icons - use same color scheme as ActivityLog
      switch (activity.actionType) {
        case 'pause':
          return <Pause className="h-4 w-4 text-amber-500" />;
        case 'resume':
          return <Play className="h-4 w-4 text-green-500" />;
        case 'cancel':
          return <X className="h-4 w-4 text-red-500" />;
        case 'reschedule':
          return <Calendar className="h-4 w-4 text-blue-500" />;
        case 'create':
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'payment_made':
          return <CreditCard className="h-4 w-4 text-clinipay-purple" />;
        case 'reminder_sent':
          return <Mail className="h-4 w-4 text-blue-500" />;
        case 'payment_refund':
          return <RefreshCcw className="h-4 w-4 text-orange-500" />;
        default:
          return <Clock className="h-4 w-4 text-gray-500" />;
      }
    }
  };

  const getActivityDescription = (activity: any) => {
    if (activity.type === 'payment') {
      // Handle payment activity
      if (activity.status === 'paid') {
        return `Payment of ${formatCurrency(activity.amount)} received`;
      } else if (activity.status === 'refunded' || activity.status === 'partially_refunded') {
        return `Payment of ${formatCurrency(activity.amount)} ${activity.status}`;
      } else {
        return `Payment request of ${formatCurrency(activity.amount)} sent`;
      }
    } else {
      // Handle plan activity
      return getActionTypeLabel(activity.actionType);
    }
  };

  const getActivityDetails = (activity: any) => {
    if (activity.type === 'payment') {
      return activity.title || activity.reference || 'Payment';
    } else {
      // Show plan activity details if available
      if (activity.details && Object.keys(activity.details).length > 0) {
        if (activity.actionType === 'reschedule') {
          return `Installment dates updated`;
        } else if (activity.actionType === 'payment_made') {
          return `Installment ${activity.details.payment_number || ''} paid`;
        } else if (activity.actionType === 'payment_refund') {
          return activity.details.is_full_refund 
            ? `Full refund of installment ${activity.details.payment_number || ''}` 
            : `Partial refund of installment ${activity.details.payment_number || ''}`;
        }
      }
      
      return '';
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Patient Activity</h3>
      
      {allActivities.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No activity found for this patient
        </div>
      ) : (
        <div className="space-y-3">
          {allActivities.map((activity, index) => (
            <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-start gap-3 p-3 border rounded-md">
              <div className="mt-1">
                {getActivityIcon(activity)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{getActivityDescription(activity)}</span>
                  {activity.type === 'payment' && (
                    <StatusBadge status={activity.status} />
                  )}
                </div>
                {getActivityDetails(activity) && (
                  <p className="text-sm text-gray-600 mt-1">{getActivityDetails(activity)}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(activity.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientActivity;

