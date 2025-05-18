import React, { useState, useEffect } from 'react';
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
import { penceToPounds, poundsToPence } from '@/services/CurrencyService';

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
  const [refundAmountDisplay, setRefundAmountDisplay] = useState<string>('');
  const [isPartialRefund, setIsPartialRefund] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens or payment amount changes
  useEffect(() => {
    // Convert from pence to pounds for display
    const amountInPounds = penceToPounds(paymentAmount);
    setRefundAmount(amountInPounds); // Start with full amount
    setRefundAmountDisplay(amountInPounds.toFixed(2));
    setIsPartialRefund(false);
    setError(null);
  }, [open, paymentAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRefundAmountDisplay(value);
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setError('Please enter a valid amount');
      return;
    }
    
    const amountInPounds = penceToPounds(paymentAmount);
    if (numericValue <= 0) {
      setError('Refund amount must be greater than 0');
    } else if (numericValue > amountInPounds) {
      setError(`Refund amount cannot exceed ${formatCurrency(paymentAmount)}`);
    } else {
      setError(null);
      setRefundAmount(numericValue);
    }
  };

  const toggleRefundType = () => {
    setIsPartialRefund(!isPartialRefund);
    if (!isPartialRefund) {
      // When switching to partial, keep the current amount
    } else {
      // When switching to full, reset to full amount
      const amountInPounds = penceToPounds(paymentAmount);
      setRefundAmount(amountInPounds);
      setRefundAmountDisplay(amountInPounds.toFixed(2));
    }
  };
  
  const handleSubmit = () => {
    // Use onConfirm if provided (for compatibility), otherwise use onRefund
    const handler = onConfirm || onRefund;
    
    if (!handler) {
      console.error('No refund handler provided');
      return;
    }
    
    if (isPartialRefund && error) {
      return;
    }
    
    // If it's a full refund or the amount equals the full amount, pass undefined amount for full refund
    const isFullRefund = !isPartialRefund || refundAmount === penceToPounds(paymentAmount);
    
    if (isFullRefund) {
      handler(undefined, paymentId);
    } else {
      handler(refundAmount, paymentId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Refund Payment</DialogTitle>
          <DialogDescription>
            {isPartialRefund 
              ? "Specify the amount to refund to the patient." 
              : "This will fully refund the payment to the patient."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              Patient: <span className="font-medium">{patientName}</span>
            </p>
            <p className="text-sm text-gray-700">
              Payment amount: <span className="font-medium">{formatCurrency(paymentAmount)}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Button
              type="button"
              variant={!isPartialRefund ? "default" : "outline"}
              onClick={() => setIsPartialRefund(false)}
              className="flex-1"
            >
              Full Refund
            </Button>
            <Button
              type="button"
              variant={isPartialRefund ? "default" : "outline"}
              onClick={() => setIsPartialRefund(true)}
              className="flex-1"
            >
              Partial Refund
            </Button>
          </div>

          {isPartialRefund && (
            <div className="mb-4">
              <Label htmlFor="refund-amount" className="block mb-2">
                Refund Amount (£)
              </Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={penceToPounds(paymentAmount)}
                value={refundAmountDisplay}
                onChange={handleAmountChange}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || (isPartialRefund && !!error)}
            className="bg-red-500 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `${isPartialRefund ? 'Partial' : 'Full'} Refund`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRefundDialog;
