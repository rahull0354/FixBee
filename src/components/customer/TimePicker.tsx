'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
}

export function TimePicker({ value, onChange, placeholder = 'Select time', timeSlot }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  // Define valid hour ranges for each time slot
  const getValidHours = () => {
    switch (timeSlot) {
      case 'morning':
        return {
          validAM: [6, 7, 8, 9, 10, 11],
          validPM: [12],
          canUseAM: true,
          canUsePM: true,
        };
      case 'afternoon':
        return {
          validAM: [],
          validPM: [12, 1, 2, 3, 4, 5],
          canUseAM: false,
          canUsePM: true,
        };
      case 'evening':
        return {
          validAM: [],
          validPM: [5, 6, 7, 8, 9],
          canUseAM: false,
          canUsePM: true,
        };
      default:
        return null;
    }
  };

  const validHours = getValidHours();

  // Check if an hour is valid for the current period
  const isHourValid = (h: number, p: 'AM' | 'PM') => {
    if (!validHours) return true;
    if (p === 'AM') return validHours.validAM.includes(h);
    return validHours.validPM.includes(h);
  };

  // Get default time based on time slot
  const getDefaultTime = (): { hour: number; minute: number; period: 'AM' | 'PM' } => {
    switch (timeSlot) {
      case 'morning': return { hour: 9, minute: 0, period: 'AM' as 'AM' | 'PM' };
      case 'afternoon': return { hour: 3, minute: 0, period: 'PM' as 'AM' | 'PM' };
      case 'evening': return { hour: 6, minute: 0, period: 'PM' as 'AM' | 'PM' };
      default: return { hour: 9, minute: 0, period: 'AM' as 'AM' | 'PM' };
    }
  };

  // Parse current value or default to slot's default time
  const parseTime = (timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } => {
    if (!timeStr) return getDefaultTime();
    const [hourStr, minuteStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return { hour, minute, period };
  };

  const { hour, minute, period } = parseTime(value);

  // Validate and adjust time when timeSlot changes or value changes
  useEffect(() => {
    if (value && validHours) {
      const parsed = parseTime(value);

      // Check if current period is valid
      const isPeriodValid = parsed.period === 'AM'
        ? validHours.canUseAM
        : validHours.canUsePM;

      // Check if current hour is valid for the period
      const isCurrentHourValid = isHourValid(parsed.hour, parsed.period);

      if (!isPeriodValid || !isCurrentHourValid) {
        // Find a valid time in the current slot
        let validHour = parsed.hour;
        let validPeriod = parsed.period;

        // Try to find a valid hour in the current period
        if (!isCurrentHourValid) {
          const validHoursInPeriod = parsed.period === 'AM' ? validHours.validAM : validHours.validPM;
          if (validHoursInPeriod.length > 0) {
            validHour = validHoursInPeriod[0];
          } else {
            // Switch to the other period if current period has no valid hours
            if (parsed.period === 'AM' && validHours.canUsePM) {
              validPeriod = 'PM';
              validHour = validHours.validPM[0];
            } else if (parsed.period === 'PM' && validHours.canUseAM) {
              validPeriod = 'AM';
              validHour = validHours.validAM[0];
            }
          }
        } else if (!isPeriodValid) {
          // Switch to the other period
          if (parsed.period === 'AM' && validHours.canUsePM) {
            validPeriod = 'PM';
            validHour = validHours.validPM[0] || parsed.hour;
          } else if (parsed.period === 'PM' && validHours.canUseAM) {
            validPeriod = 'AM';
            validHour = validHours.validAM[0] || parsed.hour;
          }
        }

        // Update the value if we had to adjust it
        if (validHour !== parsed.hour || validPeriod !== parsed.period) {
          onChange(formatTime(validHour, parsed.minute, validPeriod));
        }
      }
    }
  }, [timeSlot, value]);

  const formatTime = (h: number, m: number, p: 'AM' | 'PM') => {
    let hour24 = h;
    if (p === 'PM' && h !== 12) hour24 += 12;
    if (p === 'AM' && h === 12) hour24 = 0;
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleHourChange = (delta: number) => {
    let newHour = hour + delta;
    let attempts = 0;
    const maxAttempts = 13; // Prevent infinite loops

    // Keep incrementing/decrementing until we find a valid hour
    while (attempts < maxAttempts) {
      if (newHour > 12) newHour = 1;
      if (newHour < 1) newHour = 12;

      if (isHourValid(newHour, period)) {
        onChange(formatTime(newHour, minute, period));
        return;
      }

      newHour += delta;
      attempts++;
    }
  };

  const handleMinuteChange = (delta: number) => {
    let newMinute = minute + delta;
    if (newMinute > 59) newMinute = 0;
    if (newMinute < 0) newMinute = 59;
    onChange(formatTime(hour, newMinute, period));
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';

    // Check if we can use the new period
    if (validHours) {
      if (newPeriod === 'AM' && !validHours.canUseAM) return;
      if (newPeriod === 'PM' && !validHours.canUsePM) return;
    }

    // Find a valid hour in the new period
    let newHour = hour;
    if (validHours) {
      const validHoursInPeriod = newPeriod === 'AM' ? validHours.validAM : validHours.validPM;
      if (!validHoursInPeriod.includes(hour)) {
        // Use the first valid hour in the new period
        newHour = validHoursInPeriod.length > 0 ? validHoursInPeriod[0] : hour;
      }
    }

    onChange(formatTime(newHour, minute, newPeriod));
  };

  const handleQuickSelect = (h: number, m: number, p: 'AM' | 'PM') => {
    onChange(formatTime(h, m, p));
    setOpen(false);
  };

  const getAllQuickTimes = () => [
    { label: '6:00 AM', hour: 6, minute: 0, period: 'AM' as 'AM' | 'PM' },
    { label: '7:00 AM', hour: 7, minute: 0, period: 'AM' as 'AM' | 'PM' },
    { label: '8:00 AM', hour: 8, minute: 0, period: 'AM' as 'AM' | 'PM' },
    { label: '9:00 AM', hour: 9, minute: 0, period: 'AM' as 'AM' | 'PM' },
    { label: '10:00 AM', hour: 10, minute: 0, period: 'AM' as 'AM' | 'PM' },
    { label: '11:00 AM', hour: 11, minute: 0, period: 'AM' as 'AM' | 'PM' },
    { label: '12:00 PM', hour: 12, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '1:00 PM', hour: 1, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '2:00 PM', hour: 2, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '3:00 PM', hour: 3, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '4:00 PM', hour: 4, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '5:00 PM', hour: 5, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '6:00 PM', hour: 6, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '7:00 PM', hour: 7, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '8:00 PM', hour: 8, minute: 0, period: 'PM' as 'AM' | 'PM' },
    { label: '9:00 PM', hour: 9, minute: 0, period: 'PM' as 'AM' | 'PM' },
  ];

  const getQuickTimes = () => {
    if (!validHours) return getAllQuickTimes().slice(0, 6);

    return getAllQuickTimes().filter(time => {
      if (time.period === 'AM') return validHours.validAM.includes(time.hour);
      return validHours.validPM.includes(time.hour);
    });
  };

  const quickTimes = getQuickTimes();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-sky-200 hover:border-sky-300 hover:bg-sky-50 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base",
            !value && "text-gray-500"
          )}
          style={{ backgroundColor: 'white' }}
        >
          <Clock className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
          {value ? (
            <span className="text-xs sm:text-sm md:text-base">
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')} {period}
            </span>
          ) : (
            <span className="text-xs sm:text-sm md:text-base">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[95vw] max-w-[320px] sm:max-w-[340px] md:max-w-[360px] p-0 border-sky-200 shadow-xl rounded-lg sm:rounded-xl" align="start">
        <div className="p-3 sm:p-4 md:p-5 bg-white">
          {/* Time Slot Info */}
          {timeSlot && validHours && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-2.5 bg-linear-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg sm:rounded-xl">
              <p className="text-[10px] sm:text-xs font-semibold text-sky-900 mb-1 sm:mb-1.5">
                {timeSlot === 'morning' && 'Morning Slot: 6:00 AM - 12:00 PM'}
                {timeSlot === 'afternoon' && 'Afternoon Slot: 12:00 PM - 5:00 PM'}
                {timeSlot === 'evening' && 'Evening Slot: 5:00 PM - 9:00 PM'}
              </p>
              <p className="text-[9px] sm:text-[10px] text-sky-700">
                Only hours within this slot are available
              </p>
            </div>
          )}

          {/* Time Selector */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-5">
            {/* Hours */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => handleHourChange(1)}
                className="p-1 sm:p-1.5 md:p-2 hover:bg-sky-50 rounded-lg transition-colors group"
              >
                <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600 group-hover:text-sky-600" />
              </button>
              <div className={cn(
                "w-12 sm:w-16 md:w-20 h-10 sm:h-12 md:h-14 flex items-center justify-center border-2 rounded-lg sm:rounded-xl my-0.5 sm:my-1 transition-all duration-200",
                isHourValid(hour, period)
                  ? "bg-linear-to-r from-sky-50 to-blue-50 border-sky-200"
                  : "bg-gray-100 border-gray-300 opacity-50"
              )}>
                <span className={cn(
                  "text-lg sm:text-xl md:text-2xl font-bold",
                  isHourValid(hour, period) ? "text-sky-700" : "text-gray-500"
                )}>{String(hour).padStart(2, '0')}</span>
              </div>
              <button
                type="button"
                onClick={() => handleHourChange(-1)}
                className="p-1 sm:p-1.5 md:p-2 hover:bg-sky-50 rounded-lg transition-colors group"
              >
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600 group-hover:text-sky-600" />
              </button>
            </div>

            {/* Colon */}
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-400 pb-3 sm:pb-4 md:pb-5 px-0.5">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => handleMinuteChange(1)}
                className="p-1 sm:p-1.5 md:p-2 hover:bg-sky-50 rounded-lg transition-colors group"
              >
                <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600 group-hover:text-sky-600" />
              </button>
              <div className="w-12 sm:w-16 md:w-20 h-10 sm:h-12 md:h-14 flex items-center justify-center bg-linear-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-lg sm:rounded-xl my-0.5 sm:my-1">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-sky-700">{String(minute).padStart(2, '0')}</span>
              </div>
              <button
                type="button"
                onClick={() => handleMinuteChange(-1)}
                className="p-1 sm:p-1.5 md:p-2 hover:bg-sky-50 rounded-lg transition-colors group"
              >
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600 group-hover:text-sky-600" />
              </button>
            </div>

            {/* AM/PM Toggle */}
            <button
              type="button"
              onClick={handlePeriodToggle}
              disabled={validHours ? (!validHours.canUseAM || !validHours.canUsePM) : undefined}
              className={cn(
                "w-12 sm:w-14 md:w-16 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all duration-200 ml-1 sm:ml-2 shadow-md",
                period === 'AM'
                  ? "bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white"
                  : "bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 text-white",
                (!validHours || (validHours.canUseAM && validHours.canUsePM))
                  ? "hover:shadow-lg cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              {period}
            </button>
          </div>

          {/* Quick Times */}
          <div className="border-t border-sky-100 pt-3 sm:pt-4">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-2 sm:mb-3 px-0.5 sm:px-1">Quick Select</p>
            <div className={cn(
              "grid gap-1.5 sm:gap-2",
              quickTimes.length > 6 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3"
            )}>
              {quickTimes.map((time) => (
                <button
                  key={time.label}
                  type="button"
                  onClick={() => handleQuickSelect(time.hour, time.minute, time.period)}
                  className="px-1.5 sm:px-2.5 md:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-medium rounded-lg sm:rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300 transition-all duration-200"
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Button */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-sky-100">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="w-full py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-colors"
            >
              Clear Time
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
