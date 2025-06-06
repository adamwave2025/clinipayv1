
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ReschedulePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: (newStartDate: Date) => void;
  planName: string;
  patientName: string;
  isLoading?: boolean;
  isProcessing?: boolean;
  hasSentPayments?: boolean;
  hasOverduePayments?: boolean;
  startDate?: string;
}

const ReschedulePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isLoading = false,
  isProcessing = false,
  startDate,
}: ReschedulePlanDialogProps) => {
  // Initialize with current date or parse the startDate if provided
  const initialDate = startDate ? new Date(startDate) : new Date();
  initialDate.setHours(0, 0, 0, 0); // Normalize to midnight
  
  const [date, setDate] = useState<Date>(initialDate);
  
  // Use either isLoading or isProcessing (prioritize isProcessing)
  const isWorking = isProcessing || isLoading;

  const handleConfirm = () => {
    // Ensure the date is normalized to midnight to avoid timezone issues
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    console.log('Confirming with date:', normalizedDate.toISOString());
    onConfirm(normalizedDate);
  };

  // Disable dates in the past
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Payment Plan</DialogTitle>
          <DialogDescription>
            Select a new start date to reschedule the <span className="font-semibold">{planName}</span> payment plan for{' '}
            <span className="font-semibold">{patientName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <label htmlFor="rescheduleDate" className="text-sm font-medium">
              New Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isWorking}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-h-[300px] overflow-y-auto z-50" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      // Ensure the time is set to midnight
                      const normalizedDate = new Date(newDate);
                      normalizedDate.setHours(0, 0, 0, 0);
                      console.log('Selected date:', normalizedDate.toISOString());
                      setDate(normalizedDate);
                    }
                  }}
                  disabled={disablePastDates}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">
              All future payments will be rescheduled based on this date.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isWorking}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="btn-gradient"
            disabled={isWorking}
          >
            {isWorking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Reschedule Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReschedulePlanDialog;
