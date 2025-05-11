
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
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Choose between onRefund and onConfirm (for compatibility)
  const handleRefund = onRefund || onConfirm;

  // Format display value and validate
  useEffect(() => {
    if (open) {
      // Format the initial amount when dialog opens
      const formattedAmount = penceToPounds(paymentAmount).toFixed(2);
      setRefundAmountDisplay(formattedAmount);
      setRefundAmount(penceToPounds(paymentAmount));
      setIsPartialRefund(false);
      setHasError(false);
    }
  }, [open, paymentAmount]);
  
  // Handle text input change for currency
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only numbers, one decimal point, and limit to 2 decimal places
    if (/^[0-9]*\.?[0-9]{0,2}$/.test(inputValue) || inputValue === '') {
      setRefundAmountDisplay(inputValue);
      
      // Convert to number for internal state
      const numericValue = inputValue === '' ? 0 : parseFloat(inputValue);
      setRefundAmount(numericValue);
      
      // Validate against maximum refund amount
      const maxRefundInPounds = penceToPounds(paymentAmount);
      setHasError(numericValue > maxRefundInPounds || numericValue <= 0);
    }
  };

  // Process refund
  const handleProcessRefund = () => {
    if (handleRefund) {
      if (isPartialRefund) {
        // Partial refund with specified amount (already in pounds)
        handleRefund(refundAmount, paymentId);
      } else {
        // Full refund (pass amount in pounds)
        handleRefund(penceToPounds(paymentAmount), paymentId);
      }
    }
  };

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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">£</span>
                  <Input
                    id="amount"
                    type="text"
                    value={refundAmountDisplay}
                    onChange={handleAmountChange}
                    className="pl-7 mt-1"
                    placeholder="0.00"
                  />
                </div>
                {hasError && (
                  <p className="text-xs text-red-500 mt-1">
                    Refund amount must be between £0.01 and {formatCurrency(paymentAmount)}.
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
              (isPartialRefund && hasError)
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
