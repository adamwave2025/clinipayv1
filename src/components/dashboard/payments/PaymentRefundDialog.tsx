
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from '@/utils/formatters';

interface PaymentRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount?: number) => void;
  paymentAmount?: number;
  patientName?: string;
}

const PaymentRefundDialog = ({
  open,
  onOpenChange,
  onConfirm,
  paymentAmount = 0,
  patientName = '',
}: PaymentRefundDialogProps) => {
  const [refundAmount, setRefundAmount] = useState<number>(paymentAmount);
  const [error, setError] = useState<string>('');

  // Reset amount and error when dialog opens
  React.useEffect(() => {
    if (open) {
      setRefundAmount(paymentAmount);
      setError('');
    }
  }, [open, paymentAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setRefundAmount(value);
    
    // Validate amount
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid amount greater than 0');
    } else if (value > paymentAmount) {
      setError(`Refund amount cannot exceed the payment amount (${formatCurrency(paymentAmount)})`);
    } else {
      setError('');
    }
  };

  const handleConfirm = () => {
    // Only proceed if there's no error and amount is valid
    if (!error && refundAmount > 0 && refundAmount <= paymentAmount) {
      onConfirm(refundAmount);
    }
  };

  const isFullRefund = refundAmount === paymentAmount;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
          <AlertDialogDescription>
            {patientName && `You are about to issue a refund to ${patientName}.`} 
            Enter the amount you wish to refund. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={paymentAmount}
                value={refundAmount}
                onChange={handleAmountChange}
                className={error ? "border-red-300 focus-visible:ring-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Original Payment: {formatCurrency(paymentAmount)}</p>
              {!isFullRefund && refundAmount > 0 && (
                <p>Remaining After Refund: {formatCurrency(paymentAmount - refundAmount)}</p>
              )}
            </div>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            className="bg-red-500 hover:bg-red-600"
            disabled={!!error || refundAmount <= 0}
          >
            {isFullRefund ? 'Refund Full Amount' : 'Refund Partial Amount'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentRefundDialog;
