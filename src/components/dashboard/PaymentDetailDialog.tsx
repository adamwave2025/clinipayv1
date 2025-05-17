import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import RefundDetailsSection from './payment-details/RefundDetailsSection';
import { Button } from '@/components/ui/button';

interface PaymentDetailDialogProps {
  payment: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund?: () => void;
}

const PaymentDetailDialog: React.FC<PaymentDetailDialogProps> = ({ payment, open, onOpenChange, onRefund }) => {
  if (!payment) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            {payment.linkTitle || 'Payment'} for {payment.patientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Status:</span>
            </div>
            <div>
              <span className="font-medium">{payment.status}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Amount:</span>
            </div>
            <div>
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Date:</span>
            </div>
            <div>
              <span className="font-medium">{payment.date}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Reference:</span>
            </div>
            <div>
              <span className="font-medium">{payment.reference || '-'}</span>
            </div>
            
            {payment.stripePaymentId && (
              <>
                <div>
                  <span className="text-gray-600">Stripe Payment ID:</span>
                </div>
                <div>
                  <span className="font-medium">{payment.stripePaymentId}</span>
                </div>
              </>
            )}
            
            {payment.dueDate && (
              <>
                <div>
                  <span className="text-gray-600">Due Date:</span>
                </div>
                <div>
                  <span className="font-medium">{payment.dueDate}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <RefundDetailsSection 
          status={payment.status}
          refundedAmount={payment.refundedAmount}
          totalAmount={payment.amount}
        />
        
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onRefund && payment.status !== 'refunded' && payment.status !== 'partially_refunded' && (
            <Button variant="destructive" onClick={onRefund}>
              Refund Payment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailDialog;
