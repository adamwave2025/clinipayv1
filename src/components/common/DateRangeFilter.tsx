
import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangeFilterProps {
  fromDate: Date | undefined;
  toDate: Date | undefined;
  onFromDateChange: (date: Date | undefined) => void;
  onToDateChange: (date: Date | undefined) => void;
  className?: string;
}

const DateRangeFilter = ({ 
  fromDate, 
  toDate, 
  onFromDateChange, 
  onToDateChange, 
  className 
}: DateRangeFilterProps) => {
  const handlePresetClick = (preset: string) => {
    const today = new Date();
    
    switch (preset) {
      case 'last7Days':
        onFromDateChange(subDays(today, 7));
        onToDateChange(today);
        break;
      case 'thisMonth':
        onFromDateChange(startOfMonth(today));
        onToDateChange(today);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        onFromDateChange(startOfMonth(lastMonth));
        onToDateChange(endOfMonth(lastMonth));
        break;
      case 'yearToDate':
        onFromDateChange(startOfYear(today));
        onToDateChange(today);
        break;
      case 'clear':
        onFromDateChange(undefined);
        onToDateChange(undefined);
        break;
      default:
        break;
    }
  };

  const getDateRangeText = () => {
    if (fromDate && toDate) {
      return `${format(fromDate, 'PP')} - ${format(toDate, 'PP')}`;
    } else if (fromDate) {
      return `From ${format(fromDate, 'PP')}`;
    } else if (toDate) {
      return `Until ${format(toDate, 'PP')}`;
    }
    return 'Filter by date range';
  };

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-xs font-normal h-8 min-w-36",
              !fromDate && !toDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            <span className="truncate">{getDateRangeText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 flex flex-col space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs font-medium mb-1">From Date</div>
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={onFromDateChange}
                  initialFocus
                  className="pointer-events-auto w-full rounded-md border"
                />
              </div>
              <div>
                <div className="text-xs font-medium mb-1">To Date</div>
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={onToDateChange}
                  initialFocus
                  className="pointer-events-auto w-full rounded-md border"
                  disabled={(date) => fromDate ? date < fromDate : false}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => handlePresetClick('last7Days')}
              >
                Last 7 days
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => handlePresetClick('thisMonth')}
              >
                This month
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => handlePresetClick('lastMonth')}
              >
                Last month
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => handlePresetClick('yearToDate')}
              >
                Year to date
              </Button>
              {(fromDate || toDate) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs ml-auto"
                  onClick={() => handlePresetClick('clear')}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangeFilter;
