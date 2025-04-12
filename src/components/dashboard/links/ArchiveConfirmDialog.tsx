
import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { PaymentLink } from '@/types/payment';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  paymentLink: PaymentLink | null;
  isLoading: boolean;
  isArchiveView?: boolean;
}

const ArchiveConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  paymentLink,
  isLoading,
  isArchiveView = false
}: ArchiveConfirmDialogProps) => {
  if (!paymentLink) return null;

  const action = isArchiveView ? 'unarchive' : 'archive';
  const actionPast = isArchiveView ? 'unarchived' : 'archived';
  const actionCapitalized = isArchiveView ? 'Unarchive' : 'Archive';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionCapitalized} payment link?</AlertDialogTitle>
          <AlertDialogDescription>
            {isArchiveView 
              ? `This payment link will be restored to your active links.` 
              : `This payment link will be moved to archives and won't appear in your active links.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={isArchiveView ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              `${actionCapitalized}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ArchiveConfirmDialog;
