
import React from 'react';
import { PlanActivity, getActionTypeLabel } from '@/utils/planActivityUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, RotateCw, PauseCircle, PlayCircle, XCircle, CalendarIcon, CheckCircle2, CreditCard } from 'lucide-react';

interface ActivityLogProps {
  activities: PlanActivity[];
  isLoading: boolean;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, isLoading }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reschedule':
        return <CalendarIcon className="h-4 w-4 text-blue-500" />;
      case 'pause':
        return <PauseCircle className="h-4 w-4 text-amber-500" />;
      case 'resume':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'cancel':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'payment_made':
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'create':
        return <CheckCircle2 className="h-4 w-4 text-indigo-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeClass = (type: string) => {
    switch (type) {
      case 'reschedule':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pause':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resume':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancel':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'payment_made':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'create':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderActivityDetails = (activity: PlanActivity) => {
    const details = activity.details;

    switch (activity.actionType) {
      case 'reschedule':
        return (
          <div className="text-sm">
            <p>New start date: {details.new_start_date || 'N/A'}</p>
            <p>{details.installments_affected || 0} installments affected</p>
            {details.changes?.sent_payment_requests_cancelled?.length > 0 && (
              <p>{details.changes.sent_payment_requests_cancelled.length} payment requests cancelled</p>
            )}
          </div>
        );
      case 'pause':
        return (
          <div className="text-sm">
            <p>{details.installments_affected || 0} installments paused</p>
          </div>
        );
      case 'resume':
        return (
          <div className="text-sm">
            <p>Resume date: {details.resume_date || 'N/A'}</p>
            <p>{details.installments_affected || 0} installments resumed</p>
          </div>
        );
      case 'cancel':
        return (
          <div className="text-sm">
            <p>{details.installments_affected || 0} installments cancelled</p>
            {details.reason && <p>Reason: {details.reason}</p>}
          </div>
        );
      case 'payment_made':
        return (
          <div className="text-sm">
            <p>Payment {details.payment_number} of {details.total_payments}</p>
            <p>Amount: £{details.amount?.toFixed(2) || '0.00'}</p>
            <p>Reference: {details.payment_reference || 'N/A'}</p>
            <p>Date: {formatDate(details.payment_date)}</p>
          </div>
        );
      case 'create':
        return (
          <div className="text-sm">
            <p>Start date: {details.start_date || 'N/A'}</p>
            <p>{details.installments} payments of £{details.installment_amount?.toFixed(2) || '0.00'}</p>
            <p>Frequency: {details.frequency || 'monthly'}</p>
            <p>Total: £{details.total_amount?.toFixed(2) || '0.00'}</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        Loading activity history...
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        No activity records found for this payment plan.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Activity History</CardTitle>
        <CardDescription>Recent actions performed on this payment plan</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[180px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 border-b border-gray-100 pb-2 last:border-0">
                <div className="mt-1">
                  {getActivityIcon(activity.actionType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getActionTypeLabel(activity.actionType)}
                      </span>
                      <Badge className={`${getActivityBadgeClass(activity.actionType)}`} variant="outline">
                        {activity.actionType}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{activity.performedAt}</span>
                  </div>
                  {renderActivityDetails(activity)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
