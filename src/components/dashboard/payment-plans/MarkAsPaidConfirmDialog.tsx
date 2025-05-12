
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlanInstallment } from '@/utils/paymentPlanUtils';
import { formatCurrency } from '@/utils/formatters';

interface MarkAsPaidConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  installment?: PlanInstallment | null;
}

const MarkAsPaidConfirmDialog: React.FC<MarkAsPaidConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  installment
}) => {
  const handleConfirm = async () => {
    console.log('Confirming mark as paid');
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Payment as Paid</DialogTitle>
          <DialogDescription>
            This will record that this payment was received manually outside of the system.
          </DialogDescription>
        </DialogHeader>

        {installment && installment.amount > 0 && installment.paymentNumber > 0 && (
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Amount:</span>
                <span className="font-medium">{formatCurrency(installment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Number:</span>
                <span className="font-medium">{installment.paymentNumber} of {installment.totalPayments}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="btn-gradient relative"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Mark as Paid"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsPaidConfirmDialog;
