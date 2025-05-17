
import React, { useEffect } from 'react';
import { Plan } from '@/utils/planTypes';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanDetailsCardProps {
  plan: Plan;
  isLoading: boolean;
}

const PlanDetailsCard: React.FC<PlanDetailsCardProps> = ({ plan, isLoading }) => {
  // Debug logging for paid vs. total installments
  useEffect(() => {
    if (plan) {
      console.log('PlanDetailsCard - Plan data:', { 
        id: plan.id,
        paidInstallments: plan.paidInstallments,
        totalInstallments: plan.totalInstallments,
        progress: plan.progress
      });
    }
  }, [plan]);
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Plan Details</h3>
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}
          >
            {plan.status?.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Patient</p>
            <p className="font-medium">{plan.patientName || 'Not specified'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Start Date</p>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <p>{plan.startDate ? format(new Date(plan.startDate), 'MMM d, yyyy') : 'Not set'}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Payment Frequency</p>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <p className="capitalize">{plan.paymentFrequency || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Next Due Date</p>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <p>{plan.nextDueDate ? format(new Date(plan.nextDueDate), 'MMM d, yyyy') : 'Not set'}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Plan ID</p>
            <div className="flex items-center">
              <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {plan.id}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanDetailsCard;
