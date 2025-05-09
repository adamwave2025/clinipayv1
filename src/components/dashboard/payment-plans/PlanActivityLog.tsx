
import React from 'react';
import { PlanActivity } from '@/utils/planActivityUtils';
import { formatDate } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';

interface PlanActivityLogProps {
  activities: PlanActivity[];
}

const PlanActivityLog: React.FC<PlanActivityLogProps> = ({ activities }) => {
  const getActivityIconAndText = (activity: PlanActivity) => {
    switch (activity.actionType) {
      case 'plan_created':
        return { icon: '📝', text: 'Plan created' };
      case 'payment_marked_paid':
        return { icon: '💰', text: `Payment #${activity.details?.paymentNumber || ''} marked as paid` };
      case 'payment_rescheduled':
        return { 
          icon: '📅', 
          text: `Payment #${activity.details?.paymentNumber || ''} rescheduled from ${
            formatDate(activity.details?.originalDate)
          } to ${
            formatDate(activity.details?.newDate)
          }` 
        };
      case 'plan_paused':
        return { icon: '⏸️', text: 'Plan paused' };
      case 'plan_resumed':
        return { icon: '▶️', text: 'Plan resumed' };
      case 'plan_rescheduled':
        return { icon: '🔄', text: 'Plan rescheduled' };
      case 'plan_cancelled':
        return { icon: '❌', text: 'Plan cancelled' };
      default:
        return { icon: '🔔', text: activity.actionType };
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
            const { icon, text } = getActivityIconAndText(activity);
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start p-3 border rounded-md bg-background shadow-sm"
              >
                <div className="mr-3 text-lg">{icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{text}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.performedAt)}
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
