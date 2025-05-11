
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

interface PaymentActionMenuProps {
  paymentId: string;
  onMarkAsPaid: (id: string) => void;
  onReschedule: (id: string) => void;
  onTakePayment?: (id: string) => void;
}

const PaymentActionMenu: React.FC<PaymentActionMenuProps> = ({ 
  paymentId, 
  onMarkAsPaid, 
  onReschedule,
  onTakePayment
}) => {
  // Add logging for debugging
  const handleTakePayment = () => {
    console.log("PaymentActionMenu: Take payment clicked for ID:", paymentId);
    if (onTakePayment) {
      onTakePayment(paymentId);
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
          onClick={() => {
            console.log("PaymentActionMenu: Mark as paid clicked for ID:", paymentId);
            onMarkAsPaid(paymentId);
          }}
          className="cursor-pointer"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Mark as Paid</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => {
            console.log("PaymentActionMenu: Reschedule clicked for ID:", paymentId);
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
