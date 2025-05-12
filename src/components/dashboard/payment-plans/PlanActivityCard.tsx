
import React from 'react';
import { PlanActivity } from '@/utils/planActivityUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, AlertCircle, Pause, Play, Calendar, X } from 'lucide-react';
 
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
      case 'payment':
      case 'payment_success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'payment_failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'plan_paused':
        return <Pause className="h-5 w-5 text-amber-500" />;
      case 'plan_resumed':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'plan_rescheduled':
      case 'payment_rescheduled':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'plan_cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
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
            <p className="text-sm">{activity.description || activity.actionType.replace(/_/g, ' ')}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(activity.timestamp || activity.performedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlanActivityCard;
