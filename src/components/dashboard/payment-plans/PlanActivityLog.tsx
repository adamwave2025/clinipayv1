
import React from 'react';
import { PlanActivity } from '@/utils/planActivityUtils';
import { formatDate, formatCurrency, formatDateTime } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  CreditCard,
  CalendarClock,
  X,
  PauseCircle,
  PlayCircle
} from 'lucide-react';

interface PlanActivityLogProps {
  activities: PlanActivity[];
}

const PlanActivityLog: React.FC<PlanActivityLogProps> = ({ activities }) => {
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
    switch (activity.actionType) {
      case 'plan_created':
        return (
          <>
            <div className="font-medium">Plan created: {activity.details?.planName || 'Payment Plan'}</div>
            <div className="mt-1 space-y-1 text-sm">
              <p>Total due: {formatCurrency(activity.details?.totalAmount || 0)}</p>
              <p>Frequency: {capitalize(activity.details?.frequency || 'Monthly')}</p>
              <p>Payment amount: {formatCurrency(activity.details?.installmentAmount || 0)}</p>
              <p>Plan start date: {formatDate(activity.details?.startDate)}</p>
            </div>
          </>
        );
      case 'payment_made':
      case 'payment_marked_paid':
        return (
          <>
            <div className="font-medium">
              Payment received for {formatCurrency(activity.details?.amount || 0)}
            </div>
            <div className="mt-1 space-y-1 text-sm">
              <p>Payment: {activity.details?.paymentNumber || 1} of {activity.details?.totalPayments || 1}</p>
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
              <p>Next payment date: {formatDate(activity.details?.newDate || activity.details?.nextDueDate)}</p>
            </div>
          </>
        );
      case 'plan_cancelled':
        return (
          <>
            <div className="font-medium">Cancelled plan</div>
          </>
        );
      case 'plan_paused':
        return (
          <>
            <div className="font-medium">Paused plan</div>
          </>
        );
      case 'plan_resumed':
        return (
          <>
            <div className="font-medium">Resumed plan</div>
            <div className="mt-1 space-y-1 text-sm">
              <p>Next payment date: {formatDate(activity.details?.resumeDate || activity.details?.nextDueDate)}</p>
            </div>
          </>
        );
      default:
        return (
          <div className="font-medium">{activity.actionType.replace(/_/g, ' ')}</div>
        );
    }
  };
  
  // Helper function for capitalize (needed since this file doesn't directly import it)
  const capitalize = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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
