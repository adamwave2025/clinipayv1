
import React from 'react';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, CreditCard, RefreshCcw } from 'lucide-react';
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
      'refunded': 'warning',
      'partially_refunded': 'warning'
    };

    // Enhanced badge label to show refund status clearly
    const statusLabel = status === 'refunded' ? 'Refunded' :
                        status === 'partially_refunded' ? 'Part Refund' :
                        status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <Badge 
        variant={variants[status] as any || 'secondary'} 
        className="capitalize"
      >
        {statusLabel}
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

  const handleInstallmentClick = (installment: PlanInstallment, e: React.MouseEvent) => {
    // Only handle the click if it wasn't on a button (to prevent action buttons from triggering view)
    if (e.target instanceof Node && 
        !e.currentTarget.querySelector('.action-buttons')?.contains(e.target as Node) &&
        onViewDetails) {
      onViewDetails(installment);
    }
  };

  // Function to determine if an installment is actionable (not refunded or cancelled)
  const isActionable = (status: string) => {
    return !['refunded', 'partially_refunded', 'cancelled'].includes(status);
  };

  return (
    <div className="space-y-3">
      {installments.map((installment: PlanInstallment) => (
        <div
          key={installment.id}
          className={`border rounded-md p-4 transition-colors ${
            onViewDetails ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          onClick={(e) => onViewDetails && handleInstallmentClick(installment, e)}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Payment {installment.payment_number || '-'}</span>
                {getStatusBadge(installment.status)}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {formatDate(installment.due_date)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatCurrency(installment.amount)}</div>
              {installment.refund_amount > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <RefreshCcw className="h-3 w-3 mr-1" />
                    Refund: {formatCurrency(installment.refund_amount)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Only show action buttons for actionable statuses */}
          {isActionable(installment.status) && installment.status !== 'paid' && (
            <div className="mt-3 flex flex-wrap gap-2 action-buttons">
              {installment.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReschedule(installment.id);
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTakePayment(installment.id, installment);
                    }}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    Take Payment
                  </Button>
                </>
              )}
              
              {(installment.status === 'due' || installment.status === 'overdue') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReschedule(installment.id);
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsPaid(installment.id, installment);
                    }}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Mark as Paid
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTakePayment(installment.id, installment);
                    }}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    Take Payment
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlanScheduleCard;
