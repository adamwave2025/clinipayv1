
import React from 'react';
import { PlanActivity } from '@/utils/planActivityUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  AlertCircle, 
  Pause, 
  Play, 
  Calendar, 
  X, 
  CreditCard,
  FileText,
  RefreshCcw,
  PauseCircle,
  PlayCircle,
  CalendarClock
} from 'lucide-react';
 
interface PlanActivityCardProps {
  activities: PlanActivity[];
  isLoading: boolean;
}

const PlanActivityCard: React.FC<PlanActivityCardProps> = ({ activities, isLoading }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment_made':
      case 'payment_success':
      case 'payment_marked_paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'payment_failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'plan_paused':
      case 'paused':
        return <PauseCircle className="h-5 w-5 text-amber-500" />;
      case 'plan_resumed':
      case 'resumed':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'plan_rescheduled':
      case 'payment_rescheduled':
      case 'reschedule_plan':
      case 'reschedule_payment':
        return <CalendarClock className="h-5 w-5 text-purple-500" />;
      case 'plan_cancelled':
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'plan_created':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'payment_refunded':
      case 'refund':
        return <RefreshCcw className="h-5 w-5 text-orange-500" />;
      case 'manual_payment':
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getActivityDescription = (activity: PlanActivity) => {
    // If there's a description already provided, use that
    if (activity.description) {
      return activity.description;
    }
    
    // Otherwise, generate a description based on the action type
    switch (activity.actionType) {
      case 'plan_created':
        return 'Plan created';
      case 'payment_made':
        return `Payment received (${activity.details?.paymentNumber || ''} of ${activity.details?.totalPayments || ''})`;
      case 'payment_marked_paid':
        return 'Payment manually marked as paid';
      case 'payment_failed':
        return 'Payment failed';
      case 'plan_paused':
        return 'Plan paused';
      case 'plan_resumed':
        return 'Plan resumed';
      case 'plan_rescheduled':
        return 'Plan rescheduled';
      case 'payment_rescheduled':
        return `Payment ${activity.details?.paymentNumber || ''} rescheduled`;
      case 'plan_cancelled':
        return 'Plan cancelled';
      case 'payment_refunded':
        return 'Payment refunded';
      case 'reschedule_payment':
        return 'Payment date changed';
      case 'reschedule_plan':
        return 'Plan schedule updated';
      default:
        return activity.actionType.replace(/_/g, ' ');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed rounded-md">
        <p className="text-muted-foreground">No activity recorded for this plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className="mt-0.5">
            {getActivityIcon(activity.actionType)}
          </div>
          <div>
            <p className="text-sm font-medium">{getActivityDescription(activity)}</p>
            {activity.details && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {activity.details.newDate && (
                  <p>New date: {new Date(activity.details.newDate).toLocaleDateString()}</p>
                )}
                {activity.details.oldDueDate && activity.details.newDate && (
                  <p>Changed from {new Date(activity.details.oldDueDate).toLocaleDateString()} to {new Date(activity.details.newDate).toLocaleDateString()}</p>
                )}
                {activity.details.amount && (
                  <p>Amount: {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(activity.details.amount/100)}</p>
                )}
                {activity.details.reason && (
                  <p>Reason: {activity.details.reason}</p>
                )}
                {activity.details.payment_request_cancelled && (
                  <p>Previous payment request cancelled</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(activity.timestamp || activity.performedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlanActivityCard;
