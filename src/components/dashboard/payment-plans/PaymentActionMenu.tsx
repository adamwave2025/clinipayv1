
import React from 'react';
import { MoreVertical, CheckCircle, CalendarIcon, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { formatCurrency } from '@/utils/formatters';

interface PaymentActionMenuProps {
  paymentId: string;
  installment: PlanInstallment;
  onMarkAsPaid: (id: string, installmentDetails: PlanInstallment) => void;
  onReschedule: (id: string) => void;
  onTakePayment?: (id: string, installmentDetails: PlanInstallment) => void;
}

const PaymentActionMenu: React.FC<PaymentActionMenuProps> = ({ 
  paymentId, 
  installment,
  onMarkAsPaid, 
  onReschedule,
  onTakePayment
}) => {
  // Simplified take payment handler - no toast, just open the dialog
  const handleTakePayment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onTakePayment) {
      // Pass the ID and installment directly 
      onTakePayment(paymentId, installment);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onTakePayment && (
          <DropdownMenuItem 
            onClick={handleTakePayment}
            className="cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Take Payment</span>
          </DropdownMenuItem>
        )}
        
        {onTakePayment && <DropdownMenuSeparator />}
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("PaymentActionMenu: Mark as paid clicked for ID:", paymentId);
            toast.info(`Mark as Paid action triggered for payment ${paymentId}`);
            // Pass both the ID and the installment details
            onMarkAsPaid(paymentId, installment);
          }}
          className="cursor-pointer"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Mark as Paid</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("PaymentActionMenu: Reschedule clicked for ID:", paymentId);
            toast.info(`Reschedule action triggered for payment ${paymentId}`);
            onReschedule(paymentId);
          }}
          className="cursor-pointer"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>Reschedule Payment</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentActionMenu;
