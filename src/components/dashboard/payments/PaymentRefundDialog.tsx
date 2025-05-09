
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
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { penceToPounds } from '@/services/CurrencyService';

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
  // Convert amount from pence to pounds for display and input
  const amountInPounds = penceToPounds(paymentAmount);
  const [refundAmount, setRefundAmount] = useState<number>(amountInPounds);
  const [error, setError] = useState<string>('');
  const { isProcessingRefund } = useDashboardData();

  // Reset amount and error when dialog opens
  React.useEffect(() => {
    if (open) {
      setRefundAmount(amountInPounds);
      setError('');
    }
  }, [open, amountInPounds]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setRefundAmount(value);
    
    // Validate amount
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid amount greater than 0');
    } else if (value > amountInPounds) {
      setError(`Refund amount cannot exceed the payment amount (${formatCurrency(amountInPounds)})`);
    } else {
      setError('');
    }
  };

  const handleConfirm = () => {
    // Only proceed if there's no error and amount is valid
    if (!error && refundAmount > 0 && refundAmount <= amountInPounds) {
      onConfirm(refundAmount);
    }
  };

  // Custom handler that only allows dialog to close when not processing
  const handleOpenChange = (open: boolean) => {
    if (!isProcessingRefund) {
      onOpenChange(open);
    }
  };

  const isFullRefund = refundAmount === amountInPounds;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
          <AlertDialogDescription>
            {patientName && `You are about to issue a refund to ${patientName}.`} 
            Enter the amount you wish to refund in pounds (£). This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount (£)</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={amountInPounds}
                value={refundAmount}
                onChange={handleAmountChange}
                className={error ? "border-red-300 focus-visible:ring-red-500" : ""}
                disabled={isProcessingRefund}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Original Payment: {formatCurrency(amountInPounds)}</p>
              {!isFullRefund && refundAmount > 0 && (
                <p>Remaining After Refund: {formatCurrency(amountInPounds - refundAmount)}</p>
              )}
            </div>
            
            {isProcessingRefund && (
              <p className="text-sm text-blue-600">Processing refund, please wait...</p>
            )}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessingRefund}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            className="bg-red-500 hover:bg-red-600"
            disabled={!!error || refundAmount <= 0 || isProcessingRefund}
          >
            {isProcessingRefund ? 'Processing...' : (isFullRefund ? 'Refund Full Amount' : 'Refund Partial Amount')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentRefundDialog;
