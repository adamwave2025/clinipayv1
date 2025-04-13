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
import PaymentReferenceDisplay from '../payment/PaymentReferenceDisplay';
import { toast } from 'sonner';
import { Copy, ExternalLink, LinkIcon } from 'lucide-react';
import PaymentDetailsCard from '../payment/PaymentDetailsCard';

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

  const handleCopyReference = () => {
    if (payment.reference) {
      navigator.clipboard.writeText(payment.reference);
      toast.success('Payment reference copied to clipboard');
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
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Source</h4>
            
            {/* Show payment link title prominently if available */}
            {payment.linkTitle && (
              <div className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                {payment.isCustomAmount ? (
                  'Custom Payment Request'
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                    {payment.linkTitle}
                  </>
                )}
              </div>
            )}
            
            {/* Payment link description */}
            {payment.description && (
              <div className="text-sm text-gray-600 mb-3">{payment.description}</div>
            )}
            
            {/* Simplified source information */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">
                  {payment.isCustomAmount ? 'Custom Amount Request' : 'Payment Link'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{capitalizedType}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-sm font-medium text-gray-500">Patient</h4>
              <p className="mt-1 font-medium truncate">{payment.patientName}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-sm font-medium text-gray-500">Amount</h4>
              <p className="mt-1 font-medium">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p className="mt-1 truncate">{payment.patientEmail || 'Not provided'}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-sm font-medium text-gray-500">Phone</h4>
              <p className="mt-1 truncate">{payment.patientPhone || 'Not provided'}</p>
            </div>
            <div className="col-span-1">
              <h4 className="text-sm font-medium text-gray-500">Date</h4>
              <p className="mt-1">{payment.date}</p>
            </div>
            <div className="col-span-1">
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <StatusBadge status={payment.status} className="mt-1" />
            </div>
          </div>
          
          {/* Custom message if available (for sent payment requests) */}
          {payment.message && (
            <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Message to Patient</h4>
              <p className="text-sm text-gray-600">{payment.message}</p>
            </div>
          )}
          
          {/* Payment link actions for sent payments */}
          {payment.status === 'sent' && payment.paymentUrl && (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Link</h4>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyLink}
                  className="text-gray-700"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenLink}
                  className="text-gray-700"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Link
                </Button>
              </div>
            </div>
          )}
          
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
          
          {/* Show refund information for partially_refunded and refunded statuses */}
          {(payment.status === 'partially_refunded' || payment.status === 'refunded') && payment.refundedAmount && (
            <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Refund Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Refunded Amount:</span>
                </div>
                <div>
                  <span className="font-medium">
                    {formatCurrency(payment.refundedAmount)}
                  </span>
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
          
          {/* Only show refund button for paid payments (not already refunded) */}
          {payment.status === 'paid' && onRefund && (
            <div className="flex justify-end mt-4">
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
