
import React from 'react';
import { Plan } from '@/utils/planTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanProgressCardProps {
  plan: Plan;
  isLoading: boolean;
}

const PlanProgressCard: React.FC<PlanProgressCardProps> = ({ plan, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-12 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress percentage
  const progress = plan.progress || 
    (plan.totalInstallments > 0 ? 
      (plan.paidInstallments / plan.totalInstallments) * 100 : 0);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-2">Payment Progress</h3>
        <div className="mb-4">
          <Progress value={progress} className="h-6" />
          <p className="text-right text-sm text-muted-foreground mt-1">
            {progress.toFixed(0)}% Complete
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Paid: </span>
            {plan.paidInstallments} of {plan.totalInstallments} payments
          </p>
          <p>
            <span className="text-muted-foreground">Total Amount: </span>
            ${plan.totalAmount?.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanProgressCard;
