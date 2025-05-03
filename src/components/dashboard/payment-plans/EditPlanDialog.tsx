
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface EditFormData {
  title: string;
  description: string;
  amount: string;
}

interface EditPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: EditFormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSaveChanges: () => void;
}

const EditPlanDialog = ({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSaveChanges
}: EditPlanDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Payment Plan</DialogTitle>
          <DialogDescription>
            Update the details of this payment plan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Plan Name</label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={onFormChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={onFormChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">Amount per Payment</label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={onFormChange}
            />
          </div>
          
          <div className="pt-2 text-sm text-amber-600">
            <p>Note: Changes to payment count, payment cycle or fundamental plan structure are not supported after creation.</p>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onSaveChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlanDialog;
