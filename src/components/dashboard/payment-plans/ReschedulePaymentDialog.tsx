
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface ReschedulePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: Date) => void;
  isLoading: boolean;
}

const ReschedulePaymentDialog: React.FC<ReschedulePaymentDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Payment</DialogTitle>
          <DialogDescription>
            Select a new due date for this payment.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-md border p-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                disabled={(date) => {
                  // Disable dates in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
            </div>
          </div>

          {selectedDate && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span>
                New due date: <strong>{formatDate(selectedDate)}</strong>
              </span>
            </div>
          )}
        </div>

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
            disabled={!selectedDate || isLoading}
            className="btn-gradient"
          >
            {isLoading ? "Updating..." : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReschedulePaymentDialog;
