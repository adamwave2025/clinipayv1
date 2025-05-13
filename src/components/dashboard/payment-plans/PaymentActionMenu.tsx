
import React from 'react';
import { MoreVertical, CalendarCheck, CreditCard, RefreshCcw } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

interface PaymentActionMenuProps {
  installment: PlanInstallment;
  onMarkAsPaid: (paymentId: string, installment: PlanInstallment) => void;
  onReschedule: (paymentId: string) => void;
  onTakePayment: (paymentId: string, installment: PlanInstallment) => void;
  disableActions?: boolean;
  className?: string;
}

const PaymentActionMenu: React.FC<PaymentActionMenuProps> = ({
  installment,
  onMarkAsPaid,
  onReschedule,
  onTakePayment,
  disableActions = false,
  className
}) => {
  // Determine if actions should be disabled based on payment status
  const isPaid = installment.status === 'paid';
  const isDisabled = disableActions || isPaid;
  
  const handleRescheduleClick = () => {
    console.log('PaymentActionMenu: Reschedule clicked for payment:', installment.id);
    onReschedule(installment.id);
  };

  const handleTakePaymentClick = () => {
    console.log('PaymentActionMenu: Take payment clicked for payment:', installment.id);
    onTakePayment(installment.id, installment);
  };

  const handleMarkAsPaidClick = () => {
    console.log('PaymentActionMenu: Mark as paid clicked for payment:', installment.id);
    onMarkAsPaid(installment.id, installment);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPaid}>
        <Button 
          variant="ghost" 
          className={cn(
            "h-8 w-8 p-0", 
            isPaid && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={isPaid}
        >
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={handleMarkAsPaidClick}
          disabled={isDisabled}
          className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Mark as Paid
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleTakePaymentClick}
          disabled={isDisabled}
          className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Take Payment
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRescheduleClick}
          disabled={isDisabled}
          className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <CalendarCheck className="mr-2 h-4 w-4" />
          Reschedule
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentActionMenu;
