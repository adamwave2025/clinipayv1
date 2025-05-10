
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
import { formatCurrency, formatUserInputCurrency } from '@/utils/formatters';
import { useDashboardData } from '@/components/dashboard/DashboardDataProvider';
import { penceToPounds, poundsToPence } from '@/services/CurrencyService';

interface PaymentRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Support multiple naming conventions for the handler function
  onRefund?: (amount?: number, paymentId?: string) => void;
  onConfirm?: (amount?: number, paymentId?: string) => void;
  
  paymentId?: string; 
  paymentToRefund?: string; // For backward compatibility
  paymentAmount?: number;
  patientName?: string;
}

const PaymentRefundDialog = ({
  open,
  onOpenChange,
  onRefund,
  onConfirm,
  paymentId, 
  paymentToRefund, // Keep the old prop for backward compatibility
  paymentAmount = 0,
  patientName = '',
}: PaymentRefundDialogProps) => {
  // Convert amount from pence to pounds for display and input
  const amountInPounds = penceToPounds(paymentAmount);
  
  // Use a string state for the displayed input value
  const [refundInputValue, setRefundInputValue] = useState<string>(amountInPounds.toFixed(2));
  
  // Use a separate state for the actual numeric value
  const [refundAmount, setRefundAmount] = useState<number>(amountInPounds);
  
  const [error, setError] = useState<string>('');
  const { isProcessingRefund } = useDashboardData();

  // Unified handler function
  const handleConfirm = () => {
    // Only proceed if there's no error and amount is valid
    if (!error && refundAmount > 0 && refundAmount <= amountInPounds) {
      // Use either onRefund or onConfirm, prioritizing onRefund if both are provided
      const handler = onRefund || onConfirm;
      if (handler) {
        // Pass both amount and paymentId (or paymentToRefund as fallback)
        handler(refundAmount, paymentId || paymentToRefund || undefined);
      }
    }
  };

  // Reset amount and error when dialog opens
  React.useEffect(() => {
    if (open) {
      setRefundInputValue(amountInPounds.toFixed(2));
      setRefundAmount(amountInPounds);
      setError('');
    }
  }, [open, amountInPounds]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input or valid decimal input
    if (inputValue === '' || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
      // Always update the displayed input value
      setRefundInputValue(inputValue);
      
      // Only update numeric value and validate if input is not empty
      if (inputValue !== '') {
        const value = parseFloat(inputValue);
        
        // Only update numeric state if it's a valid number
        if (!isNaN(value)) {
          setRefundAmount(value);
          
          // Validate amount
          if (value <= 0) {
            setError('Please enter a valid amount greater than 0');
          } else if (value > amountInPounds) {
            setError(`Refund amount cannot exceed the payment amount (${formatCurrency(paymentAmount)})`);
          } else {
            setError('');
          }
        } else {
          setError('Please enter a valid number');
        }
      } else {
        // Input is empty, set appropriate error
        setError('Please enter a refund amount');
      }
    }
  };

  // Handle input blur to format the displayed value
  const handleBlur = () => {
    // If input is empty or invalid, don't try to format
    if (refundInputValue === '' || isNaN(parseFloat(refundInputValue))) {
      return;
    }
    
    // Format value to always show 2 decimal places when user leaves the field
    const value = parseFloat(refundInputValue);
    if (!isNaN(value)) {
      setRefundInputValue(value.toFixed(2));
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
              <Label htmlFor="refund-amount" className="flex items-center">
                Refund Amount
                <span className="text-lg ml-1 font-medium">£</span>
              </Label>
              <Input
                id="refund-amount"
                type="text"
                inputMode="decimal"
                value={refundInputValue}
                onChange={handleAmountChange}
                onBlur={handleBlur}
                className={error ? "border-red-300 focus-visible:ring-red-500" : ""}
                disabled={isProcessingRefund}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Original Payment: {formatCurrency(paymentAmount)}</p>
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
            disabled={!!error || refundAmount <= 0 || isProcessingRefund || refundInputValue === ''}
          >
            {isProcessingRefund ? 'Processing...' : (isFullRefund ? 'Refund Full Amount' : 'Refund Partial Amount')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentRefundDialog;
