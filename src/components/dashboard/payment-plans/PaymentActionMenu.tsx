
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
  // IMPROVED: Enhanced data validation and better debug logging
  const handleTakePayment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("PaymentActionMenu: Take payment clicked for ID:", paymentId);
    console.log("PaymentActionMenu: Full installment data:", JSON.stringify(installment, null, 2));
    
    if (!installment || typeof installment !== 'object') {
      toast.error(`Cannot process payment: Missing installment data`);
      console.error("PaymentActionMenu: Invalid installment object:", installment);
      return;
    }
    
    if (!installment.amount) {
      toast.error(`Cannot process payment: Missing amount data`);
      console.error("PaymentActionMenu: Missing amount in installment:", installment);
      return;
    }
    
    if (!onTakePayment) {
      console.error("PaymentActionMenu: onTakePayment handler is not defined!");
      toast.error("Payment handler is not configured");
      return;
    }
    
    // Create a deep clone of the installment to prevent any reference issues
    const safeInstallment: PlanInstallment = JSON.parse(JSON.stringify({
      ...installment,
      id: paymentId, // Ensure ID is set
      // Set fallback values for any potentially missing properties
      amount: installment.amount,
      paymentNumber: installment.paymentNumber || 1,
      totalPayments: installment.totalPayments || 1,
      dueDate: installment.dueDate || new Date().toISOString(),
      status: installment.status || 'pending'
    }));
    
    // Call the handler with both required parameters and the enhanced installment data
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
