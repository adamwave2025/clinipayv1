
import React from 'react';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';

interface PlanScheduleCardProps {
  installments: PlanInstallment[];
  isLoading: boolean;
  onMarkAsPaid: (id: string, installment: PlanInstallment) => void;
  onReschedule: (id: string) => void;
  onTakePayment: (id: string, installment: PlanInstallment) => void;
  onViewDetails?: (installment: PlanInstallment) => void;
}

const PlanScheduleCard: React.FC<PlanScheduleCardProps> = ({
  installments,
  isLoading,
  onMarkAsPaid,
  onReschedule,
  onTakePayment,
  onViewDetails
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'paid': 'success',
      'due': 'secondary',
      'overdue': 'destructive',
      'paused': 'warning',
      'pending': 'outline',
      'cancelled': 'destructive',
      'scheduled': 'secondary',
      'processing': 'secondary',
      'sent': 'primary',
      'refunded': 'secondary',
      'partially_refunded': 'secondary'
    };

    return (
      <Badge 
        variant={variants[status] as any || 'secondary'} 
        className="capitalize"
      >
        {status === 'partially_refunded' ? 'Partially Refunded' : status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="p-4 border rounded-md space-y-2"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!installments || installments.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed rounded-md">
        <p className="text-muted-foreground">No payments scheduled for this plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {installments.map((installment) => (
        <div 
          key={installment.id}
          className={`p-4 border rounded-md space-y-2 ${onViewDetails && installment.status !== 'pending' && installment.status !== 'sent' && installment.status !== 'cancelled' ? 'cursor-pointer hover:bg-muted/50' : ''}`}
          onClick={() => onViewDetails && installment.status !== 'pending' && installment.status !== 'sent' && installment.status !== 'cancelled' ? onViewDetails(installment) : null}
        >
          <div className="flex justify-between items-center">
            <div className="font-medium">
              Payment #{installment.paymentNumber} of {installment.totalPayments}
            </div>
            {getStatusBadge(installment.status)}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-muted-foreground mr-1">Due:</span> 
              {formatDate(installment.dueDate)}
              {installment.paidDate && (
                <span className="ml-2">
                  <span className="text-muted-foreground mr-1">Paid:</span> 
                  {formatDate(installment.paidDate)}
                </span>
              )}
            </div>
            <div className="font-semibold">
              {formatCurrency(installment.amount)}
            </div>
          </div>
          
          {/* Only show actions if the payment is not paid, cancelled, refunded, or partially refunded */}
          {!['paid', 'cancelled', 'refunded', 'partially_refunded'].includes(installment.status) && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsPaid(installment.id, installment);
                }}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Mark as Paid
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Calling onReschedule for payment ID:", installment.id);
                  onReschedule(installment.id);
                }}
              >
                <Calendar className="mr-1 h-4 w-4" />
                Reschedule
              </Button>
              
              <Button 
                size="sm"
                className="flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onTakePayment(installment.id, installment);
                }}
              >
                <CreditCard className="mr-1 h-4 w-4" />
                Take Payment
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlanScheduleCard;
