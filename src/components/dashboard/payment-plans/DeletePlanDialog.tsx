
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { PaymentLink } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';

interface DeletePlanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  planToDelete: PaymentLink | null;
  onConfirmDelete: () => void;
}

const DeletePlanDialog = ({
  isOpen,
  onOpenChange,
  planToDelete,
  onConfirmDelete
}: DeletePlanDialogProps) => {
  if (!planToDelete) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Payment Plan</DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this payment plan? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-4 border rounded-md bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-700">Confirm deletion of:</h3>
              <p className="text-sm text-gray-700 mt-1"><strong>Plan Name:</strong> {planToDelete.title}</p>
              <p className="text-sm text-gray-700"><strong>Amount:</strong> {formatCurrency(planToDelete.amount)}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            variant="destructive"
            onClick={onConfirmDelete}
          >
            Delete Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePlanDialog;
