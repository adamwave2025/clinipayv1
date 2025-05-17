
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface RefundPaymentDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  paymentId: string | null;
  onRefundSuccess: () => Promise<void>;
}

const RefundPaymentDialog = ({
  open,
  setOpen,
  paymentId,
  onRefundSuccess,
}: RefundPaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefund = async () => {
    if (!paymentId) return;
    
    setIsProcessing(true);
    try {
      // Process refund logic would go here
      await onRefundSuccess();
      setOpen(false);
    } catch (error) {
      console.error("Error processing refund:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Refund Payment</DialogTitle>
          <DialogDescription>
            Confirm payment refund to the patient.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p>Are you sure you want to refund this payment? This action cannot be undone.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleRefund}
            variant="destructive"
            disabled={isProcessing || !paymentId}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Refund Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundPaymentDialog;
