
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReschedulePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: Date) => void;
  isLoading?: boolean;
}

const ReschedulePaymentDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: ReschedulePaymentDialogProps) => {
  console.log("ReschedulePaymentDialog rendering with open:", open);
  
  // Start with tomorrow's date as default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const [date, setDate] = useState<Date>(tomorrow);
  
  const handleConfirm = () => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    console.log('Confirming payment reschedule with date:', normalizedDate.toISOString());
    onConfirm(normalizedDate);
  };
  
  // Function to get tomorrow's date as a string for min date input
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Payment</DialogTitle>
          <DialogDescription>
            Select a new date for this payment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <label htmlFor="rescheduleDate" className="text-sm font-medium">
              New Payment Date
            </label>
            <div className="relative">
              <input
                id="rescheduleDate"
                type="date"
                className="w-full px-4 py-2 border rounded-md pl-10" 
                value={date.toISOString().split('T')[0]}
                min={getTomorrowString()}
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = new Date(e.target.value);
                    newDate.setHours(0, 0, 0, 0);
                    console.log('Selected date for payment:', newDate.toISOString());
                    setDate(newDate);
                  }
                }}
                disabled={isLoading}
              />
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select a future date for the rescheduled payment.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="btn-gradient"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Reschedule Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReschedulePaymentDialog;
