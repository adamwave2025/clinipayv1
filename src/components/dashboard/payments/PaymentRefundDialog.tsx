
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface PaymentRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund?: (amount?: number, paymentId?: string) => void;
  onConfirm?: (amount?: number, paymentId?: string) => void; // Added for compatibility
  paymentAmount?: number;
  patientName?: string;
  paymentId?: string;
  isLoading?: boolean;
}

const PaymentRefundDialog: React.FC<PaymentRefundDialogProps> = ({
  open,
  onOpenChange,
  onRefund,
  onConfirm,
  paymentAmount = 0,
  patientName = 'patient',
  paymentId,
  isLoading = false,
}) => {
  // State for partial refund amount
  const [refundAmount, setRefundAmount] = useState<number>(paymentAmount);
  const [isPartialRefund, setIsPartialRefund] = useState<boolean>(false);
  
  // Choose between onRefund and onConfirm (for compatibility)
  const handleRefund = onRefund || onConfirm;

  // Process refund
  const handleProcessRefund = () => {
    if (handleRefund) {
      if (isPartialRefund) {
        // Partial refund with specified amount
        handleRefund(refundAmount, paymentId);
      } else {
        // Full refund
        handleRefund(paymentAmount, paymentId);
      }
    }
  };

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setRefundAmount(paymentAmount);
      setIsPartialRefund(false);
    }
  }, [open, paymentAmount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Refund Payment</DialogTitle>
          <DialogDescription>
            Process a refund for {patientName}'s payment of {formatCurrency(paymentAmount)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="fullRefund"
                name="refundType"
                checked={!isPartialRefund}
                onChange={() => setIsPartialRefund(false)}
                className="mr-2"
              />
              <Label htmlFor="fullRefund">Full refund ({formatCurrency(paymentAmount)})</Label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="partialRefund"
                name="refundType"
                checked={isPartialRefund}
                onChange={() => setIsPartialRefund(true)}
                className="mr-2"
              />
              <Label htmlFor="partialRefund">Partial refund</Label>
            </div>
            
            {isPartialRefund && (
              <div className="ml-6 mt-2">
                <Label htmlFor="amount" className="text-sm">Refund amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={refundAmount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setRefundAmount(isNaN(value) ? 0 : value);
                  }}
                  min={1}
                  max={paymentAmount}
                  step={1}
                  className="mt-1"
                />
                {refundAmount > paymentAmount && (
                  <p className="text-xs text-red-500 mt-1">
                    Refund amount cannot exceed original payment amount.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessRefund}
            disabled={
              isLoading || 
              (isPartialRefund && (refundAmount <= 0 || refundAmount > paymentAmount))
            }
            variant="destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Refund'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRefundDialog;
