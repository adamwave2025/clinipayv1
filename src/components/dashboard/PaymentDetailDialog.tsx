
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Payment } from '@/types/payment';
import PaymentReferenceDisplay from '../payment/PaymentReferenceDisplay';
import { toast } from 'sonner';
import PaymentSourceSection from './payment-details/PaymentSourceSection';
import PatientDetailsSection from './payment-details/PatientDetailsSection';
import CustomMessageSection from './payment-details/CustomMessageSection';
import PaymentLinkActionsSection from './payment-details/PaymentLinkActionsSection';
import RefundDetailsSection from './payment-details/RefundDetailsSection';
import PaymentActionsSection from './payment-details/PaymentActionsSection';

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
    }
  };

  const handleCopyReference = () => {
    if (payment.reference) {
      navigator.clipboard.writeText(payment.reference);
      toast.success('Payment reference copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            View detailed information about this payment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Payment Source Information */}
          <PaymentSourceSection payment={payment} />
          
          {/* Patient and Payment Details */}
          <PatientDetailsSection payment={payment} />
          
          {/* Custom message if available */}
          <CustomMessageSection message={payment.message} />
          
          {/* Payment link actions */}
          <PaymentLinkActionsSection 
            status={payment.status} 
            paymentUrl={payment.paymentUrl} 
          />
          
          {/* Payment Reference */}
          {payment.reference && (
            <div className="mt-2">
              <PaymentReferenceDisplay 
                reference={payment.reference} 
                className="mt-2"
                onCopy={handleCopyReference}
              />
            </div>
          )}
          
          {/* Refund information */}
          <RefundDetailsSection 
            status={payment.status}
            refundedAmount={payment.refundedAmount}
            totalAmount={payment.amount}
          />
          
          {/* Refund action button - now passes manualPayment prop */}
          <PaymentActionsSection 
            status={payment.status}
            onRefund={handleRefund}
            manualPayment={payment.manualPayment}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailDialog;
