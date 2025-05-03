
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

interface ResumePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: (resumeDate: Date) => void;
  planName: string;
  patientName: string;
  isProcessing?: boolean;
}

const ResumePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isProcessing = false,
}: ResumePlanDialogProps) => {
  const [date, setDate] = useState<Date>(new Date());

  const handleConfirm = () => {
    onConfirm(date);
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
          <DialogTitle>Resume Payment Plan</DialogTitle>
          <DialogDescription>
            Select a date to resume the <span className="font-semibold">{planName}</span> payment plan for{' '}
            <span className="font-semibold">{patientName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <label htmlFor="resumeDate" className="text-sm font-medium">
              Resume Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isProcessing}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
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
          <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Resume Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePlanDialog;
