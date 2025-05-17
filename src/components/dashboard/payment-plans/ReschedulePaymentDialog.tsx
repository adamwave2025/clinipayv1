
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
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
  maxAllowedDate?: Date;
}

const ReschedulePaymentDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  maxAllowedDate,
}: ReschedulePaymentDialogProps) => {
  console.log("ReschedulePaymentDialog rendering with open:", open, "maxAllowedDate:", maxAllowedDate);
  
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
  
  // Function to disable dates
  const disabledDates = (currentDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First check if it's in the past
    if (currentDate < today) return true;
    
    // Then check if it's beyond the max allowed date (if provided)
    if (maxAllowedDate && currentDate > maxAllowedDate) return true;
    
    return false;
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
            <div className="mt-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                disabled={disabledDates}
                initialFocus
                className="rounded-md border"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {maxAllowedDate ? (
                <>You can select any date up to {format(maxAllowedDate, "PPP")} (before the next payment date).</>
              ) : (
                <>Select a future date for the rescheduled payment.</>
              )}
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
