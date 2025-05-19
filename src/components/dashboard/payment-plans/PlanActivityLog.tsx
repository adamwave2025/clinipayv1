import React, { useEffect } from 'react';
import { PlanActivity, getActionTypeLabel, capitalize } from '@/utils/planActivityUtils';
import { formatDate, formatCurrency, formatDateTime } from '@/utils/formatters';
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

interface PlanActivityLogProps {
  activities: PlanActivity[];
}

const PlanActivityLog: React.FC<PlanActivityLogProps> = ({ activities }) => {
  // Add useEffect to debug the activity data
  useEffect(() => {
    console.log('PlanActivityLog - Received activities:', activities);
    if (activities?.length > 0) {
      // Log details of each activity to help debug
      activities.forEach(activity => {
        console.log(`Activity ${activity.id} (${activity.actionType}):`, {
          details: activity.details,
          timestamp: activity.performedAt
        });
      });
    }
  }, [activities]);
  
  // Function to get icon based on action type
  const getActivityIcon = (activity: PlanActivity) => {
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
      case 'payment_refund':
      case 'partial_refund':
        return <RefreshCcw className="h-4 w-4 text-orange-500" />;
      case 'payment_reminder_sent':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to render the content based on activity type
  const renderActivityContent = (activity: PlanActivity) => {
    // Debug logging to trace data issues
    if (process.env.NODE_ENV !== 'production') {
      console.log(`PlanActivityLog - Rendering activity (${activity.actionType}):`, activity.details);
    }
    
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
              {activity.actionType === 'payment_marked_paid' ? 'Payment manually marked as paid' : 'Payment received'}
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
                activity.details?.installmentNumber && activity.details?.totalInstallments ? (
                  <p>Payment: {activity.details.installmentNumber} of {activity.details.totalInstallments}</p>
                ) : (
                  <p>Payment processed successfully</p>
                )
              )}
              {activity.details?.payment_ref && 
                <p className="text-xs text-gray-500">Reference: {activity.details.payment_ref}</p>
              }
              {activity.details?.paymentReference && 
                <p className="text-xs text-gray-500">Reference: {activity.details.paymentReference}</p>
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
      case 'payment_refund':
        return (
          <>
            <div className="font-medium">Payment fully refunded</div>
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
              {activity.details?.payment_reference && (
                <p className="text-xs text-gray-500">Reference: {activity.details.payment_reference}</p>
              )}
            </div>
          </>
        );
      case 'partial_refund':
        return (
          <>
            <div className="font-medium">Payment partially refunded</div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.refundAmount && (
                <p>Refund amount: {formatCurrency(activity.details.refundAmount)}</p>
              )}
              {activity.details?.paymentNumber && activity.details?.totalPayments && (
                <p>Payment {activity.details.paymentNumber} of {activity.details.totalPayments}</p>
              )}
              {activity.details?.payment_reference && (
                <p className="text-xs text-gray-500">Reference: {activity.details.payment_reference}</p>
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
      default:
        return (
          <div className="font-medium">{activity.actionType.replace(/_/g, ' ')}</div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activity recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            return (
              <div 
                key={activity.id} 
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanActivityLog;
