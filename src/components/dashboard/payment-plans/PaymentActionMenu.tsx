
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
import { formatCurrency } from '@/utils/formatters';

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
  const handleTakePayment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("PaymentActionMenu: Take payment clicked, validating data...");
    console.log("  - Payment ID:", paymentId);
    console.log("  - Payment ID length:", paymentId ? paymentId.length : 'undefined');
    console.log("  - Handler exists:", Boolean(onTakePayment));
    console.log("  - Installment exists:", Boolean(installment));
    console.log("  - Installment data:", JSON.stringify(installment, null, 2));
    
    if (!paymentId || paymentId === '') {
      console.error("PaymentActionMenu: CRITICAL ERROR - Missing or empty payment ID!");
      toast.error("Cannot process payment: Missing payment ID");
      return;
    }
    
    if (!onTakePayment) {
      console.error("PaymentActionMenu: onTakePayment handler is not defined!");
      toast.error("Payment handler is not configured");
      return;
    }
    
    // Validate installment data
    if (!installment || !installment.amount) {
      console.error("PaymentActionMenu: Missing or invalid installment data", installment);
      toast.error("Cannot process payment: Invalid installment data");
      return;
    }
    
    // Log amount info for debugging
    const amountDisplay = installment?.amount 
      ? formatCurrency(installment.amount) 
      : "unknown amount";
    
    toast.info(`Preparing payment for ${amountDisplay} (ID: ${paymentId})`);
    
    // Explicitly log the payment ID to confirm it's valid
    console.log("PaymentActionMenu: PAYMENT FLOW - Triggering payment with valid data:", {
      paymentId,
      amount: installment?.amount,
      installment: JSON.stringify(installment)
    });
    
    // Create a copy with trimmed ID to avoid issues with whitespace
    const validPaymentId = paymentId.trim();
    const validInstallment = {
      ...installment,
      id: validPaymentId
    };
    
    // Pass both the ID and the full installment object
    onTakePayment(validPaymentId, validInstallment);
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
