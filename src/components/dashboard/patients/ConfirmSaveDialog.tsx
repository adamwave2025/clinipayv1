
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ConfirmSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changedFields: Record<string, { from: string; to: string }>;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const ConfirmSaveDialog: React.FC<ConfirmSaveDialogProps> = ({
  open,
  onOpenChange,
  changedFields,
  onConfirm,
  isSubmitting
}) => {
  const fieldCount = Object.keys(changedFields).length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save the following changes?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            {fieldCount === 0 ? (
              <p className="text-sm text-gray-500">No changes detected.</p>
            ) : (
              Object.entries(changedFields).map(([field, { from, to }]) => (
                <div key={field} className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium capitalize">{field}:</div>
                  <div className="col-span-2">
                    <span className="text-gray-500 line-through mr-2">{from || 'None'}</span>
                    <span className="text-green-600">{to || 'None'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isSubmitting || fieldCount === 0}
            className={isSubmitting ? 'opacity-70' : ''}
          >
            {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmSaveDialog;
