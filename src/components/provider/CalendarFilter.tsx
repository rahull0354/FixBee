'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarFilterProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export function CalendarFilter({ value, onChange, placeholder = 'Filter by date' }: CalendarFilterProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDate(date);
    if (value === dateStr) {
      onChange(''); // Deselect if clicking same date
    } else {
      onChange(dateStr);
    }
    setOpen(false);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onChange(formatDate(today));
    setOpen(false);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50",
            !value && "text-gray-500"
          )}
          style={{ backgroundColor: 'white' }}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
          {value ? (
            new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-emerald-200 shadow-xl" align="start">
        <div className="p-4 bg-white rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-emerald-50 rounded-lg transition-colors group"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 group-hover:text-emerald-600" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-emerald-50 rounded-lg transition-colors group"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-emerald-600" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="h-9" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const selected = isSelectedDate(day);
              const today = isToday(day);
              const past = isPastDate(day);

              return (
                <button
                  key={day}
                  onClick={() => !past && handleDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                  disabled={past}
                  className={cn(
                    "h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    "hover:scale-105 active:scale-95",
                    selected && "bg-linear-to-br from-emerald-400 via-teal-400 to-cyan-400 text-white shadow-lg",
                    !selected && !past && "hover:bg-emerald-50 text-gray-700",
                    today && !selected && "border-2 border-emerald-400",
                    past && "text-gray-300 cursor-not-allowed",
                    selected && "hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500"
                  )}
                >
                  <span className="relative z-10">{day}</span>
                  {today && !selected && (
                    <span className="absolute inset-0 rounded-lg border-2 border-emerald-400 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-emerald-100">
            <button
              onClick={handleToday}
              className="w-full py-2 px-4 bg-linear-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 font-medium rounded-lg transition-all duration-200 text-sm"
            >
              Today
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
