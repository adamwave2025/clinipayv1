
import React from 'react';
import { Plan } from '@/utils/planTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PlanDetailsCardProps {
  plan: Plan;
  isLoading: boolean;
}

const PlanDetailsCard: React.FC<PlanDetailsCardProps> = ({ plan, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };
  
  const getBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Plan Details</h3>
          <Badge 
            variant={getBadgeVariant(plan.status) as any} 
            className="capitalize"
          >
            {plan.status || 'pending'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
          <div>
            <p className="text-sm text-muted-foreground">Patient</p>
            <p className="font-medium">{plan.patientName || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Payment Amount</p>
            <p className="font-medium">${plan.installmentAmount?.toFixed(2)}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Payment Frequency</p>
            <p className="font-medium capitalize">{plan.paymentFrequency || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium">{formatDate(plan.startDate)}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Next Payment Date</p>
            <p className="font-medium">{formatDate(plan.nextDueDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanDetailsCard;
