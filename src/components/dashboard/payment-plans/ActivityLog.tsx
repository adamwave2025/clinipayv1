
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlanActivity, getActionTypeLabel } from '@/utils/planActivityUtils';
import { formatDateTime } from '@/utils/formatters';
import { 
  Clock, MessageCircle, AlertCircle, CheckCircle, 
  BanCircle, PauseCircle, PlayCircle, CalendarClock, FileText 
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
        return <CalendarClock className="h-4 w-4 text-blue-500" />;
      case 'pause':
        return <PauseCircle className="h-4 w-4 text-amber-500" />;
      case 'resume':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'cancel':
        return <BanCircle className="h-4 w-4 text-red-500" />;
      case 'payment_made':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_refund':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'reminder_sent':
        return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'create':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="pt-2">
        <h3 className="text-md font-semibold mb-2">Activity Log</h3>
        <div className="flex justify-center py-4 border rounded-md">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h3 className="text-md font-semibold mb-2">Activity Log</h3>
      {activities.length === 0 ? (
        <div className="text-center py-4 text-gray-500 border rounded-md">
          No activity recorded yet
        </div>
      ) : (
        <div className="border rounded-md">
          <ScrollArea className="h-[200px] p-2">
            <div className="space-y-3 p-2">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.actionType)}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">{getActionTypeLabel(activity.actionType)}</p>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(activity.performedAt, 'en-GB', 'Europe/London')}
                      </span>
                    </div>
                    {activity.details && activity.details.message && (
                      <p className="text-sm text-gray-600">{activity.details.message}</p>
                    )}
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
