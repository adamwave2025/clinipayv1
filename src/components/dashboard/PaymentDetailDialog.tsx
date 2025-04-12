
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
import { Payment } from '@/types/payment';
import { capitalizeFirstLetter, formatCurrency } from '@/utils/formatters';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import PaymentReferenceDisplay from '../payment/PaymentReferenceDisplay';

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

  const handleCopyLink = () => {
    if (payment.paymentUrl) {
      navigator.clipboard.writeText(payment.paymentUrl);
      toast.success('Payment link copied to clipboard');
    }
  };

  const handleOpenLink = () => {
    if (payment.paymentUrl) {
      window.open(payment.paymentUrl, '_blank');
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
          
          {/* Show refund information for both full and partial refunds */}
          {(payment.status === 'partially_refunded' || payment.status === 'refunded') && payment.refundedAmount && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-blue-700 mb-1">Refund Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Refunded Amount:</span>
                </div>
                <div>
                  <span className="font-medium">{formatCurrency(payment.refundedAmount)}</span>
                </div>
                
                {payment.status === 'partially_refunded' && (
                  <>
                    <div>
                      <span className="text-gray-600">Remaining Amount:</span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {formatCurrency(payment.amount - payment.refundedAmount)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {payment.status === 'sent' && payment.paymentUrl && (
            <div className="bg-gray-50 p-3 rounded-md mt-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Link (for testing)</h4>
              <div className="flex items-center p-2 bg-white rounded border">
                <span className="text-sm text-gray-600 truncate flex-1">
                  {payment.paymentUrl}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCopyLink}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleOpenLink}
                  className="ml-1"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Only show refund button for paid payments (not already refunded) */}
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
