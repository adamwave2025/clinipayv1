
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlanActivity, getActionTypeLabel } from '@/utils/planActivityUtils';
import { formatDateTime, formatCurrency, formatDate } from '@/utils/formatters';
import { 
  Clock, MessageCircle, AlertCircle, CheckCircle, 
  Ban, PauseCircle, PlayCircle, CalendarClock, FileText,
  CreditCard, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ActivityLogProps {
  activities: PlanActivity[];
  isLoading?: boolean;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, isLoading = false }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reschedule':
      case 'reschedule_plan':
        return <CalendarClock className="h-4 w-4 text-blue-500" />;
      case 'pause':
      case 'pause_plan':
        return <PauseCircle className="h-4 w-4 text-amber-500" />;
      case 'resume':
      case 'resume_plan':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'cancel':
      case 'cancel_plan':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'payment_made':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'payment_refund':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'reminder_sent':
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'create':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'complete':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityDescription = (activity: PlanActivity) => {
    const { actionType, details } = activity;

    switch (actionType) {
      case 'payment_made':
        return `Payment of ${formatCurrency(details.amount || 0)} received`;
      case 'payment_refund':
        return `Payment of ${formatCurrency(details.amount || 0)} ${details.refundFee ? 'partially refunded' : 'refunded'}`;
      case 'reschedule':
      case 'reschedule_plan':
        return `Plan rescheduled to ${formatDate(details.newDate || details.new_start_date)}`;
      case 'pause':
      case 'pause_plan':
        return `Plan paused`;
      case 'resume':
      case 'resume_plan':
        return `Plan resumed`;
      case 'cancel':
      case 'cancel_plan':
        return 'Plan cancelled';
      case 'create':
        return `Plan created with ${details.totalInstallments || details.total_payments || details.total_installments || 0} installments`;
      case 'complete':
      case 'completed':
        return `Plan completed - ${formatCurrency(details.totalPaid || details.total_paid || 0)} paid`;
      case 'reminder_sent':
        return `Payment reminder sent for installment ${details.installmentNumber || 0}`;
      case 'overdue':
        return `${details.overdue_count || details.overdue_items?.length || 0} payment${details.overdue_count !== 1 || details.overdue_items?.length !== 1 ? 's are' : ' is'} overdue`;
      default:
        return getActionTypeLabel(actionType);
    }
  };

  // Function to get detailed activity information
  const getActivityDetails = (activity: PlanActivity) => {
    const { actionType, details } = activity;

    if (!details) return null;

    switch (actionType) {
      case 'payment_made':
        return (
          <>
            {details.title && <p>{details.title}</p>}
            {details.paymentRef && <p>Reference: {details.paymentRef}</p>}
            {details.reference && <p>Reference: {details.reference}</p>}
            {details.installmentNumber && (
              <p>Payment {details.installmentNumber} of {details.totalInstallments || '?'}</p>
            )}
            {details.payment_number && (
              <p>Payment {details.payment_number} of {details.total_payments || '?'}</p>
            )}
          </>
        );
      
      case 'payment_refund':
        return (
          <>
            {details.title && <p>{details.title}</p>}
            {details.paymentRef && <p>Original payment: {details.paymentRef}</p>}
            {details.reference && <p>Original payment: {details.reference}</p>}
            {details.reason && <p>Reason: {details.reason}</p>}
          </>
        );
      
      case 'reschedule':
      case 'reschedule_plan':
        return (
          <>
            {details.plan_name && <p>{details.plan_name}</p>}
            {details.affected_payments && <p>Affected payments: {details.affected_payments}</p>}
            {details.days_shifted && <p>Days shifted: {details.days_shifted}</p>}
            {details.was_overdue && <p>Plan was previously overdue</p>}
          </>
        );
      
      case 'pause':
      case 'pause_plan':
        return (
          <>
            {details.plan_name && <p>{details.plan_name}</p>}
            {details.reason && <p>Reason: {details.reason}</p>}
            {details.pending_count > 0 && <p>Pending payments paused: {details.pending_count}</p>}
            {details.sent_count > 0 && <p>Sent payment links paused: {details.sent_count}</p>}
            {details.overdue_count > 0 && <p>Overdue payments paused: {details.overdue_count}</p>}
          </>
        );
      
      case 'resume':
      case 'resume_plan':
        return (
          <>
            {details.plan_name && <p>{details.plan_name}</p>}
            {details.resumeDate && <p>Resume date: {formatDate(details.resumeDate)}</p>}
            {details.resume_date && <p>Resume date: {formatDate(details.resume_date)}</p>}
            {details.sent_payments_reset > 0 && <p>Payment links reset: {details.sent_payments_reset}</p>}
            {details.hasSentPayments && <p>Previously paused payment links restored</p>}
            {details.overdue_payments_found > 0 && <p>Overdue payments detected: {details.overdue_payments_found}</p>}
          </>
        );
      
      case 'cancel':
      case 'cancel_plan':
        return (
          <>
            {details.plan_name && <p>{details.plan_name}</p>}
            {details.reason && <p>Reason: {details.reason}</p>}
            {details.previous_status && <p>Previous status: {details.previous_status}</p>}
          </>
        );
      
      case 'create':
        return (
          <>
            {details.title || details.plan_name && <p>{details.title || details.plan_name}</p>}
            <p>Total amount: {formatCurrency(details.totalAmount || details.total_amount || 0)}</p>
            <p>Frequency: {details.frequency || details.payment_frequency || 'Monthly'}</p>
          </>
        );
      
      case 'complete':
      case 'completed':
        return (
          <>
            {details.title || details.plan_name && <p>{details.title || details.plan_name}</p>}
            <p>Total paid: {formatCurrency(details.totalPaid || details.total_paid || 0)}</p>
            {details.completedAt || details.completed_at ? (
              <p>Completed on: {formatDate(details.completedAt || details.completed_at)}</p>
            ) : null}
          </>
        );
      
      case 'reminder_sent':
        return (
          <>
            {details.title && <p>{details.title}</p>}
            {details.dueDate && <p>Due date: {formatDate(details.dueDate)}</p>}
            {details.sentTo && <p>Sent to: {details.sentTo}</p>}
          </>
        );
      
      case 'overdue':
        return (
          <>
            {details.plan_name && <p>{details.plan_name}</p>}
            {details.overdue_items && details.overdue_items.length > 0 && (
              <>
                {details.overdue_items.map((item: any, i: number) => (
                  <p key={i}>Payment #{item.payment_number} due {formatDate(item.due_date)}</p>
                ))}
              </>
            )}
          </>
        );
      
      default:
        return details.message ? (
          <p>{details.message}</p>
        ) : null;
    }
  };

  if (isLoading) {
    return (
      <div className="pt-2">
        <h3 className="text-lg font-medium mb-4">Activity Log</h3>
        <div className="flex justify-center py-4 border rounded-md">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h3 className="text-lg font-medium mb-4">Activity Log</h3>
      {activities.length === 0 ? (
        <div className="text-center py-6 text-gray-500 border rounded-md">
          No activity recorded yet
        </div>
      ) : (
        <div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="mt-1">
                    {getActivityIcon(activity.actionType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{getActivityDescription(activity)}</span>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-sm">
                      {getActivityDetails(activity)}
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDateTime(activity.performedAt, 'en-GB', 'Europe/London')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
