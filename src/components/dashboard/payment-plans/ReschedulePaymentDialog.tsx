
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
import CustomDatePicker from '@/components/common/CustomDatePicker';

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
  // Start with tomorrow's date as default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const [date, setDate] = useState<Date>(tomorrow);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const handleConfirm = () => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    console.log('Confirming payment reschedule with date:', normalizedDate.toISOString());
    onConfirm(normalizedDate);
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
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setShowDatePicker(!showDatePicker)}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
              
              {showDatePicker && (
                <div className="absolute z-50 mt-2 bg-white rounded-md shadow-lg">
                  <CustomDatePicker
                    selectedDate={date}
                    onDateChange={(newDate) => {
                      setDate(newDate);
                      setShowDatePicker(false);
                    }}
                    disablePastDates={true}
                  />
                </div>
              )}
            </div>
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
