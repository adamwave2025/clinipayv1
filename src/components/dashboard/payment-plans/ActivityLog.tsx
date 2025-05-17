
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { PlanActivity, capitalize } from '@/utils/planActivityUtils';
import { formatDate, formatCurrency, formatDateTime } from '@/utils/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  FileText,
  CreditCard,
  CalendarClock,
  X,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  RefreshCcw,
  AlertCircle,
  MessageCircle
} from 'lucide-react';

interface ActivityLogProps {
  activities: PlanActivity[];
  isLoading?: boolean;
}

const ActivityLog: React.FC<ActivityLogProps> = React.memo(({ 
  activities, 
  isLoading = false
}) => {
  // Use state to store deduplicated activities
  const [processedActivities, setProcessedActivities] = useState<PlanActivity[]>([]);
  
  // Memoize and deduplicate activities to prevent duplicate rendering
  useEffect(() => {
    if (!Array.isArray(activities)) {
      console.warn('ActivityLog - activities is not an array:', activities);
      setProcessedActivities([]);
      return;
    }
    
    // Create a Map using activity IDs as keys to eliminate duplicates
    const uniqueActivities = new Map<string, PlanActivity>();
    
    activities.forEach(activity => {
      if (!uniqueActivities.has(activity.id)) {
        uniqueActivities.set(activity.id, activity);
      }
    });
    
    // Convert map back to array and sort by date (newest first)
    const deduplicatedActivities = Array.from(uniqueActivities.values())
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
    
    console.log('ActivityLog - Processed activities:', deduplicatedActivities.length);
    setProcessedActivities(deduplicatedActivities);
  }, [activities]);
  
  // Function to get icon based on action type - memoized for performance
  const getActivityIcon = useCallback((activity: PlanActivity) => {
    switch (activity.actionType) {
      case 'plan_created':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'payment_made':
      case 'payment_marked_paid':
      case 'card_payment_processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'plan_rescheduled':
      case 'payment_rescheduled':
      case 'reschedule_plan':
      case 'reschedule_payment':
        return <CalendarClock className="h-4 w-4 text-amber-500" />;
      case 'plan_cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      case 'plan_paused':
        return <PauseCircle className="h-4 w-4 text-orange-500" />;
      case 'plan_resumed':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'payment_refunded':
        return <RefreshCcw className="h-4 w-4 text-orange-500" />;
      case 'payment_reminder_sent':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  // Function to render the content based on activity type
  const renderActivityContent = useCallback((activity: PlanActivity) => {
    switch (activity.actionType) {
      case 'plan_created':
        return (
          <>
            <div className="font-medium">Plan created: {activity.details?.planName || 'Payment Plan'}</div>
            <div className="mt-1 space-y-1 text-sm">
              <p>Total due: {activity.details?.totalAmount ? formatCurrency(activity.details.totalAmount) : 'Not specified'}</p>
              <p>Frequency: {capitalize(activity.details?.frequency || 'Not specified')}</p>
              <p>Payment amount: {activity.details?.installmentAmount ? formatCurrency(activity.details.installmentAmount) : 'Not specified'}</p>
              <p>Plan start date: {activity.details?.startDate ? formatDate(activity.details.startDate) : 'Not specified'}</p>
            </div>
          </>
        );
      case 'payment_made':
      case 'payment_marked_paid':
        return (
          <>
            <div className="font-medium">
              {activity.actionType === 'payment_marked_paid' ? 'Payment marked as paid' : 'Payment received'} 
              {activity.details?.amount ? ` for ${formatCurrency(activity.details.amount)}` : ''}
            </div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.paymentNumber && activity.details?.totalPayments ? (
                <p>Payment: {activity.details.paymentNumber} of {activity.details.totalPayments}</p>
              ) : (
                <p>Payment processed</p>
              )}
              {activity.details?.reference && <p>Reference: {activity.details.reference}</p>}
              {activity.details?.manualPayment && <p className="text-amber-600">Manual payment</p>}
            </div>
          </>
        );
      case 'card_payment_processed': 
        return (
          <>
            <div className="font-medium">
              Card payment processed
              {activity.details?.amount ? ` for ${formatCurrency(activity.details.amount)}` : ''}
            </div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.payment_number && activity.details?.total_payments ? (
                <p>Payment: {activity.details.payment_number} of {activity.details.total_payments}</p>
              ) : (
                <p>Payment processed successfully</p>
              )}
              {activity.details?.stripe_payment_id && 
                <p className="text-xs text-gray-500">Reference: {activity.details.stripe_payment_id}</p>
              }
              {activity.details?.processed_at && 
                <p className="text-xs text-gray-500">Processed: {formatDate(activity.details.processed_at)}</p>
              }
              <p className="text-green-600">Online card payment</p>
            </div>
          </>
        );
      case 'plan_rescheduled':
      case 'reschedule_plan':
        return (
          <>
            <div className="font-medium">Rescheduled plan</div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.oldStartDate && activity.details?.newStartDate && (
                <p>Changed from {formatDate(activity.details.oldStartDate)} to {formatDate(activity.details.newStartDate)}</p>
              )}
              {!activity.details?.oldStartDate && activity.details?.newStartDate && (
                <p>Next payment date: {formatDate(activity.details.newStartDate)}</p>
              )}
              {!activity.details?.oldStartDate && !activity.details?.newStartDate && activity.details?.nextDueDate && (
                <p>Next payment date: {formatDate(activity.details.nextDueDate)}</p>
              )}
            </div>
          </>
        );
      case 'payment_rescheduled':
      case 'reschedule_payment':
        return (
          <>
            <div className="font-medium">Rescheduled payment</div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.paymentNumber && activity.details?.totalPayments && (
                <p>Payment {activity.details.paymentNumber} of {activity.details.totalPayments}</p>
              )}
              {activity.details?.oldDueDate && activity.details?.newDate && (
                <p>Changed from {formatDate(activity.details.oldDueDate)} to {formatDate(activity.details.newDate)}</p>
              )}
              {activity.details?.amount && (
                <p>Amount: {formatCurrency(activity.details.amount)}</p>
              )}
            </div>
          </>
        );
      case 'plan_cancelled':
        return (
          <>
            <div className="font-medium">Cancelled plan</div>
            {activity.details?.reason && (
              <div className="mt-1 space-y-1 text-sm">
                <p>Reason: {activity.details.reason}</p>
              </div>
            )}
          </>
        );
      case 'plan_paused':
        return (
          <>
            <div className="font-medium">Paused plan</div>
            {activity.details?.reason && (
              <div className="mt-1 space-y-1 text-sm">
                <p>Reason: {activity.details.reason}</p>
              </div>
            )}
          </>
        );
      case 'plan_resumed':
        return (
          <>
            <div className="font-medium">Resumed plan</div>
            <div className="mt-1 space-y-1 text-sm">
              <p>Next payment date: {formatDate(activity.details?.resumeDate || activity.details?.nextDueDate || 'Not specified')}</p>
            </div>
          </>
        );
      case 'payment_refunded':
        return (
          <>
            <div className="font-medium">Payment refunded</div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.refundAmount && (
                <p>Refund amount: {formatCurrency(activity.details.refundAmount)}</p>
              )}
              {activity.details?.isFullRefund && (
                <p>Full refund</p>
              )}
              {activity.details?.paymentNumber && activity.details?.totalPayments && (
                <p>Payment {activity.details.paymentNumber} of {activity.details.totalPayments}</p>
              )}
            </div>
          </>
        );
      case 'payment_reminder_sent':
        return (
          <>
            <div className="font-medium">Payment reminder sent</div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.paymentNumber && activity.details?.totalPayments && (
                <p>Payment {activity.details.paymentNumber} of {activity.details.totalPayments}</p>
              )}
              {activity.details?.dueDate && (
                <p>Due date: {formatDate(activity.details.dueDate)}</p>
              )}
              {activity.details?.amount && (
                <p>Amount: {formatCurrency(activity.details.amount)}</p>
              )}
            </div>
          </>
        );
      case 'payment_failed':
        return (
          <>
            <div className="font-medium">Payment failed</div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.amount && (
                <p>Amount: {formatCurrency(activity.details.amount)}</p>
              )}
              {activity.details?.error && (
                <p className="text-red-500">Error: {activity.details.error}</p>
              )}
            </div>
          </>
        );
      default:
        return (
          <div className="font-medium">{activity.actionType.replace(/_/g, ' ')}</div>
        );
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {processedActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activity recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {processedActivities.map((activity) => (
            <div 
              key={`${activity.id}-${activity.actionType}`} 
              className="flex items-start p-3 border rounded-md bg-background shadow-sm"
            >
              <div className="mr-3 text-lg">
                {getActivityIcon(activity)}
              </div>
              <div className="flex-1">
                {renderActivityContent(activity)}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(activity.performedAt, 'en-GB', 'Europe/London')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  
  // Compare activities by length and IDs
  if (prevProps.activities.length !== nextProps.activities.length) return false;
  
  // If activities array references are different but contents are the same
  const prevIds = new Set(prevProps.activities.map(a => a.id));
  const nextIds = new Set(nextProps.activities.map(a => a.id));
  
  if (prevIds.size !== nextIds.size) return false;
  
  for (const id of prevIds) {
    if (!nextIds.has(id)) return false;
  }
  
  return true;
});

// Add display name for debugging
ActivityLog.displayName = 'ActivityLog';

export default ActivityLog;
