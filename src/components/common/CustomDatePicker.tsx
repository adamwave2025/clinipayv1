
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';

interface CustomDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  disablePastDates?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onDateChange,
  disablePastDates = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    onDateChange(day);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div 
            key={day} 
            className="text-center text-sm font-medium text-gray-600 py-1"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    // Create today's date with time at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = new Date(day);
        
        // Check if the day should be disabled
        const isDisabled = disablePastDates && cloneDay < today;
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        days.push(
          <div
            key={day.toString()}
            className={`relative p-1 text-center cursor-pointer ${
              !isCurrentMonth ? 'text-gray-400' : 
              isDisabled ? 'text-gray-300 cursor-not-allowed' : 
              isSameDay(day, selectedDate) ? 'bg-blue-500 text-white rounded-full' : 
              isToday(day) ? 'bg-gray-200 rounded-full' : ''
            }`}
            onClick={() => !isDisabled && isCurrentMonth && onDateClick(cloneDay)}
          >
            <span className="text-sm">{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 mb-2">
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 max-w-xs w-full">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default CustomDatePicker;
