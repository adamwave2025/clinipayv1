
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

interface ArchivePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  plan: PaymentLink | null;
  isLoading: boolean;
  isUnarchive?: boolean;
}

const ArchivePlanDialog = ({
  open,
  onOpenChange,
  onConfirm,
  plan,
  isLoading,
  isUnarchive = false
}: ArchivePlanDialogProps) => {
  if (!plan) return null;

  const action = isUnarchive ? 'restore' : 'archive';
  const actionPast = isUnarchive ? 'restored' : 'archived';
  const actionCapitalized = isUnarchive ? 'Restore' : 'Archive';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionCapitalized} payment plan?</AlertDialogTitle>
          <AlertDialogDescription>
            {isUnarchive 
              ? `This payment plan will be restored to your active plans.` 
              : `This payment plan will be moved to archives and won't appear in your active plans.`}
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
            className={isUnarchive ? "bg-green-600 hover:bg-green-700" : ""}
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

export default ArchivePlanDialog;
