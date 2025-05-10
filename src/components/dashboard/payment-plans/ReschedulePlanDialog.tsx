
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
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
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface ReschedulePlanDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onConfirm: (newStartDate: Date) => void;
  planName: string;
  patientName: string;
  isLoading?: boolean;
  isProcessing?: boolean; // Add isProcessing prop
  hasSentPayments?: boolean;
  hasOverduePayments?: boolean;
  startDate?: string; // Added this prop for compatibility
}

const ReschedulePlanDialog = ({
  showDialog,
  setShowDialog,
  onConfirm,
  planName,
  patientName,
  isLoading = false,
  isProcessing = false, // Add isProcessing with default value
  hasSentPayments = false,
  hasOverduePayments = false,
  startDate, // Accept the startDate prop
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
              <PopoverContent className="w-auto p-0 max-h-[300px] overflow-y-auto" align="start">
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
            
            {hasSentPayments && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> This plan has payment requests that have been sent to the patient. 
                  Rescheduling will cancel those requests and reset them to pending status. 
                  You'll need to send them again after rescheduling.
                </p>
              </div>
            )}

            {hasOverduePayments && (
              <Alert className="mt-4 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-xs text-red-700">
                  <strong>Warning:</strong> This plan has overdue payments. 
                  Rescheduling will reset the overdue status and give the patient more time to pay.
                </AlertDescription>
              </Alert>
            )}
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
