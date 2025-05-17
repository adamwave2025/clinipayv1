
import React from 'react';
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

interface MarkAsPaidDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

const MarkAsPaidDialog = ({
  open,
  setOpen,
  onConfirm,
  isLoading = false,
}: MarkAsPaidDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Payment as Paid</DialogTitle>
          <DialogDescription>
            This will mark the payment as paid manually.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p>Are you sure you want to mark this payment as paid? This action cannot be undone.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="btn-gradient"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Mark as Paid'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsPaidDialog;
