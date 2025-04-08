
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '../common/StatusBadge';
import { X } from 'lucide-react';
import { Payment } from './RecentPaymentsCard';

interface PaymentDetailDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund?: (paymentId: string) => void;
}

const PaymentDetailDialog = ({ 
  payment, 
  open, 
  onOpenChange,
  onRefund
}: PaymentDetailDialogProps) => {
  if (!payment) return null;

  const handleRefund = () => {
    if (onRefund && payment.status === 'paid') {
      onRefund(payment.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            View detailed information about this payment.
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Patient</h4>
              <p className="mt-1 font-medium">{payment.patientName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Amount</h4>
              <p className="mt-1 font-medium">£{payment.amount.toFixed(2)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p className="mt-1">{payment.patientEmail || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Phone</h4>
              <p className="mt-1">{payment.patientPhone || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Date</h4>
              <p className="mt-1">{payment.date}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="mt-1">{payment.type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <StatusBadge status={payment.status} className="mt-1" />
            </div>
          </div>
          
          {payment.status === 'paid' && onRefund && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleRefund}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Issue Refund
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailDialog;
