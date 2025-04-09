
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '../common/StatusBadge';
import { Payment } from './RecentPaymentsCard';
import { capitalizeFirstLetter, formatCurrency } from '@/utils/formatters';

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

  // Capitalize first letter of payment type
  const capitalizedType = capitalizeFirstLetter(payment.type);

  const handleRefund = () => {
    if (onRefund && payment.status === 'paid') {
      onRefund(payment.id);
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
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Patient</h4>
              <p className="mt-1 font-medium">{payment.patientName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Amount</h4>
              <p className="mt-1 font-medium">{formatCurrency(payment.amount)}</p>
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
              <p className="mt-1">{capitalizedType}</p>
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
