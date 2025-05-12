
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
import { toast } from '@/hooks/use-toast';
import { PlanInstallment } from '@/utils/paymentPlanUtils';

interface PaymentActionMenuProps {
  paymentId: string;
  installment: PlanInstallment;
  onMarkAsPaid: (id: string) => void;
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
  // Deep clone the installment data to ensure we have a complete copy that won't be affected by reference issues
  const safeInstallment = React.useMemo(() => {
    // First validate that we have the essential data
    if (!installment || typeof installment !== 'object' || !installment.amount) {
      console.error("PaymentActionMenu: Invalid installment object received:", installment);
      return null;
    }
    
    try {
      // Create a complete deep clone with all required fields
      return JSON.parse(JSON.stringify({
        ...installment,
        id: paymentId, // Ensure ID is always set
        amount: installment.amount,
        paymentNumber: installment.paymentNumber || 1,
        totalPayments: installment.totalPayments || 1,
        dueDate: installment.dueDate || new Date().toISOString(),
        status: installment.status || 'pending'
      }));
    } catch (err) {
      console.error("PaymentActionMenu: Failed to clone installment:", err);
      return null;
    }
  }, [paymentId, installment]);
  
  const handleTakePayment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("PaymentActionMenu: Take payment clicked for ID:", paymentId);
    
    if (!safeInstallment) {
      toast.error(`Cannot process payment: Missing or invalid installment data`);
      console.error("PaymentActionMenu: No valid installment data available");
      return;
    }
    
    if (!onTakePayment) {
      console.error("PaymentActionMenu: onTakePayment handler is not defined!");
      toast.error("Payment handler is not configured");
      return;
    }
    
    toast.info(`Take Payment action triggered for payment ${paymentId}`);
    console.log("PaymentActionMenu: Passing complete installment data:", safeInstallment);
    onTakePayment(paymentId, safeInstallment);
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
        {onTakePayment && safeInstallment && (
          <DropdownMenuItem 
            onClick={handleTakePayment}
            className="cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Take Payment</span>
          </DropdownMenuItem>
        )}
        
        {onTakePayment && safeInstallment && <DropdownMenuSeparator />}
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("PaymentActionMenu: Mark as paid clicked for ID:", paymentId);
            toast.info(`Mark as Paid action triggered for payment ${paymentId}`);
            onMarkAsPaid(paymentId);
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
