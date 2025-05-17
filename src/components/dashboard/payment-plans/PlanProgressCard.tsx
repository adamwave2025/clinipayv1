
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/formatters';
import { Plan } from '@/utils/planTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface PlanProgressCardProps {
  plan: Plan | null;
  isLoading: boolean;
  installments?: any[]; // Add installments prop to calculate accurate progress
}

const PlanProgressCard: React.FC<PlanProgressCardProps> = ({ 
  plan, 
  isLoading,
  installments = [] 
}) => {
  // Calculate the plan progress based on installments data
  const progress = useMemo(() => {
    if (!plan || !installments.length) return 0;
    
    const paidCount = installments.filter(i => i.status === 'paid').length;
    const totalCount = installments.length;
    
    if (totalCount === 0) return 0;
    return Math.round((paidCount / totalCount) * 100);
  }, [plan, installments]);
  
  // Calculate the amount paid based on installments data
  const amountPaid = useMemo(() => {
    if (!installments.length) return 0;
    
    return installments
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [installments]);

  // Format the next payment due date
  const nextPaymentDue = useMemo(() => {
    if (!plan?.nextDueDate) return 'Not scheduled';
    
    const dueDate = new Date(plan.nextDueDate);
    const now = new Date();
    
    if (dueDate < now) {
      return 'Overdue';
    }
    
    try {
      return formatDistanceToNow(dueDate, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  }, [plan?.nextDueDate]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No plan selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Plan Progress</h3>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">
              {progress}% Complete
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-xl font-semibold">{formatCurrency(amountPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-semibold">{formatCurrency(plan.totalAmount || 0)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Next payment due</p>
            <p className="font-medium">{nextPaymentDue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanProgressCard;
