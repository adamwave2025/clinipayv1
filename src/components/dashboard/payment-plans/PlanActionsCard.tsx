
import React from 'react';
import { Plan } from '@/utils/planTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play, X, Calendar, Send } from 'lucide-react';

interface PlanActionsCardProps {
  plan: Plan;
  onOpenCancelDialog?: () => void;
  onOpenPauseDialog?: () => void;
  onOpenResumeDialog?: () => void;
  onOpenRescheduleDialog?: () => void;
  onSendReminder?: () => void;
}

const PlanActionsCard: React.FC<PlanActionsCardProps> = ({
  plan,
  onOpenCancelDialog,
  onOpenPauseDialog,
  onOpenResumeDialog,
  onOpenRescheduleDialog,
  onSendReminder
}) => {
  const isPaused = plan.status === 'paused';
  const isCancelled = plan.status === 'cancelled';
  const isActive = plan.status === 'active';
  const isCompleted = plan.status === 'completed';

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Plan Actions</h3>
        <div className="flex flex-wrap gap-3">
          {!isCancelled && !isCompleted && (
            <>
              {isPaused ? (
                <Button 
                  variant="outline" 
                  onClick={onOpenResumeDialog}
                  className="flex items-center"
                  disabled={!onOpenResumeDialog}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume Plan
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={onOpenPauseDialog}
                  className="flex items-center"
                  disabled={!onOpenPauseDialog || !isActive}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Plan
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={onOpenRescheduleDialog}
                className="flex items-center"
                disabled={!onOpenRescheduleDialog}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reschedule Plan
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onOpenCancelDialog}
                className="flex items-center text-destructive hover:text-destructive"
                disabled={!onOpenCancelDialog}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Plan
              </Button>
            </>
          )}
          
          {isActive && onSendReminder && (
            <Button 
              variant="outline" 
              onClick={onSendReminder}
              className="flex items-center"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Payment Reminder
            </Button>
          )}
          
          {(isCancelled || isCompleted) && (
            <p className="text-sm text-muted-foreground">
              No actions available for {isCancelled ? 'cancelled' : 'completed'} plans.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanActionsCard;
