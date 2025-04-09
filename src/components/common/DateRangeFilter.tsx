
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
import { DateRange } from 'react-day-picker';
import { useIsMobile } from '@/hooks/use-mobile';

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

const DateRangeFilter = ({ 
  dateRange, 
  onDateRangeChange, 
  className 
}: DateRangeFilterProps) => {
  const isMobile = useIsMobile();
  
  const handlePresetClick = (preset: string) => {
    const today = new Date();
    
    switch (preset) {
      case 'last7Days':
        onDateRangeChange({ 
          from: subDays(today, 7), 
          to: today 
        });
        break;
      case 'thisMonth':
        onDateRangeChange({ 
          from: startOfMonth(today), 
          to: today 
        });
        break;
      case 'lastMonth':
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        onDateRangeChange({ 
          from: startOfMonth(lastMonth), 
          to: endOfMonth(lastMonth) 
        });
        break;
      case 'yearToDate':
        onDateRangeChange({ 
          from: startOfYear(today), 
          to: today 
        });
        break;
      case 'clear':
        onDateRangeChange(undefined);
        break;
      default:
        break;
    }
  };

  const getDateRangeText = () => {
    if (dateRange?.from && dateRange?.to) {
      if (format(dateRange.from, 'PP') === format(dateRange.to, 'PP')) {
        return format(dateRange.from, 'PP');
      }
      return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
    } else if (dateRange?.from) {
      return `From ${format(dateRange.from, 'PP')}`;
    } else if (dateRange?.to) {
      return `Until ${format(dateRange.to, 'PP')}`;
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
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            <span className="truncate">{getDateRangeText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className={cn("p-3 flex flex-col space-y-3", isMobile ? "max-w-[300px]" : "")}>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              initialFocus
              numberOfMonths={isMobile ? 1 : 2}
              className="pointer-events-auto rounded-md border"
            />
            
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
              {dateRange && (
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
