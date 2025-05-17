
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export interface TakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentProcessed: () => Promise<void>;
  paymentId: string;
  amount: number;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
}

const TakePaymentDialog: React.FC<TakePaymentDialogProps> = ({
  open,
  onOpenChange,
  onPaymentProcessed,
  paymentId,
  amount,
  patientName,
  patientEmail,
  patientPhone
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [reference, setReference] = useState('');
  
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Here you would typically call your payment processing API
      // For now, we'll just simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Processing payment:', {
        paymentId,
        amount,
        method: paymentMethod,
        reference,
        patientName,
        patientEmail,
        patientPhone
      });
      
      // Call the onPaymentProcessed callback
      await onPaymentProcessed();
      
      // Close the dialog after successful payment
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Take Manual Payment</DialogTitle>
          <DialogDescription>
            Record a manual payment for this installment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Payment Amount</p>
            <p className="font-semibold text-lg">${amount.toFixed(2)}</p>
          </div>
          
          {patientName && (
            <div>
              <p className="text-sm font-medium mb-1">Patient</p>
              <p>{patientName}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Method</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
              >
                Card
              </Button>
              <Button
                type="button"
                size="sm"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
              >
                Cash
              </Button>
              <Button
                type="button"
                size="sm"
                variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('bank')}
              >
                Bank Transfer
              </Button>
            </div>
          </div>
          
          <div>
            <label htmlFor="reference" className="text-sm font-medium">
              Reference (Optional)
            </label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Last 4 digits of card, receipt number"
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TakePaymentDialog;
