
import React, { useEffect } from 'react';
import { PlanActivity, capitalize } from '@/utils/planActivityUtils';
import { formatDate, formatCurrency, formatDateTime } from '@/utils/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  FileText,
  CreditCard,
  CalendarClock,
  X,
  PauseCircle,
  PlayCircle
} from 'lucide-react';

interface ActivityLogProps {
  activities: PlanActivity[];
  isLoading?: boolean;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, isLoading = false }) => {
  // Add useEffect to debug the activity data
  useEffect(() => {
    console.log('ActivityLog - Received activities:', activities);
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
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'plan_rescheduled':
      case 'payment_rescheduled':
        return <CalendarClock className="h-4 w-4 text-amber-500" />;
      case 'plan_cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      case 'plan_paused':
        return <PauseCircle className="h-4 w-4 text-orange-500" />;
      case 'plan_resumed':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to render the content based on activity type
  const renderActivityContent = (activity: PlanActivity) => {
    // Debug logging to trace data issues
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Rendering activity (${activity.actionType}):`, activity.details);
    }
    
    switch (activity.actionType) {
      case 'plan_created':
        return (
          <>
            <div className="font-medium">Plan created: {activity.details?.planName || 'Payment Plan'}</div>
            <div className="mt-1 space-y-1 text-sm">
              <p>Total due: {activity.details?.totalAmount ? formatCurrency(activity.details.totalAmount) : 'N/A'}</p>
              <p>Frequency: {capitalize(activity.details?.frequency || 'Monthly')}</p>
              <p>Payment amount: {activity.details?.installmentAmount ? formatCurrency(activity.details.installmentAmount) : 'N/A'}</p>
              <p>Plan start date: {activity.details?.startDate ? formatDate(activity.details.startDate) : 'N/A'}</p>
            </div>
          </>
        );
      case 'payment_made':
      case 'payment_marked_paid':
        return (
          <>
            <div className="font-medium">
              Payment received for {activity.details?.amount ? formatCurrency(activity.details.amount) : 'N/A'}
            </div>
            <div className="mt-1 space-y-1 text-sm">
              {activity.details?.paymentNumber && activity.details?.totalPayments ? (
                <p>Payment: {activity.details.paymentNumber} of {activity.details.totalPayments}</p>
              ) : (
                <p>Payment processed</p>
              )}
              {activity.details?.reference && <p>Reference: {activity.details.reference}</p>}
            </div>
          </>
        );
      case 'plan_rescheduled':
      case 'payment_rescheduled':
        return (
          <>
            <div className="font-medium">Rescheduled plan</div>
            <div className="mt-1 space-y-1 text-sm">
              <p>Next payment date: {formatDate(activity.details?.newDate || activity.details?.nextDueDate || 'N/A')}</p>
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
              <p>Next payment date: {formatDate(activity.details?.resumeDate || activity.details?.nextDueDate || 'N/A')}</p>
            </div>
          </>
        );
      default:
        return (
          <div className="font-medium">{activity.actionType.replace(/_/g, ' ')}</div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activity recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
