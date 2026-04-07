'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CalendarFilter } from '@/components/provider/CalendarFilter';
import { TimePicker } from '@/components/provider/TimePicker';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  currentSchedule?: {
    date: string;
    timeSlot: string;
    preferredTime?: string;
  };
  status: string;
  onRescheduleSuccess: () => void;
}

const REASON_CODES = [
  { value: 'cannot_reach_location', label: 'Cannot Reach Location' },
  { value: 'traffic_emergency', label: 'Traffic Emergency' },
  { value: 'personal_emergency', label: 'Personal Emergency' },
  { value: 'customer_unavailable', label: 'Customer Unavailable' },
  { value: 'weather_conditions', label: 'Weather Conditions' },
  { value: 'other', label: 'Other' },
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (6 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
  { value: 'evening', label: 'Evening (5 PM - 9 PM)' },
];

export function RescheduleDialog({
  open,
  onOpenChange,
  requestId,
  currentSchedule,
  status,
  onRescheduleSuccess,
}: RescheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schedule: {
      date: '',
      timeSlot: '',
      preferredTime: '',
    },
    reason: '',
    reasonCode: '',
    proof: '',
  });

  // Validate reschedule time window when dialog opens
  useEffect(() => {
    if (open && currentSchedule) {
      // Pre-fill form with current schedule
      setFormData({
        schedule: {
          date: currentSchedule.date || '',
          timeSlot: currentSchedule.timeSlot || '',
          preferredTime: currentSchedule.preferredTime || '',
        },
        reason: '',
        reasonCode: '',
        proof: '',
      });

      // Validate time window
      validateRescheduleWindow();
    }
  }, [open, currentSchedule]);

  // Reset time slot when date changes to avoid conflicts
  useEffect(() => {
    if (formData.schedule.date) {
      const selectedDate = new Date(formData.schedule.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If date changed from today, reset time slot
      const currentScheduleDate = currentSchedule?.date ? new Date(currentSchedule.date) : null;
      if (currentScheduleDate && selectedDate.toDateString() !== currentScheduleDate.toDateString()) {
        setFormData(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            timeSlot: '' // Reset time slot when date changes
          }
        }));
      }
    }
  }, [formData.schedule.date, currentSchedule?.date]);

  const validateRescheduleWindow = () => {
    if (!currentSchedule || !currentSchedule.date || !currentSchedule.timeSlot) {
      return;
    }

    const now = new Date();
    const scheduleDate = new Date(currentSchedule.date);

    // Calculate slot end time based on timeSlot
    const getSlotEndTime = (timeSlot: string): Date => {
      switch (timeSlot) {
        case 'morning': // 6 AM - 12 PM
          return new Date(scheduleDate.setHours(12, 0, 0, 0));
        case 'afternoon': // 12 PM - 5 PM
          return new Date(scheduleDate.setHours(17, 0, 0, 0));
        case 'evening': // 5 PM - 9 PM
          return new Date(scheduleDate.setHours(21, 0, 0, 0));
        default:
          return new Date(scheduleDate.setHours(17, 0, 0, 0));
      }
    };

    const slotEndTime = getSlotEndTime(currentSchedule.timeSlot);

    // Calculate valid window: 1 hour before slot ends to 1 hour after slot ends
    const windowStart = new Date(slotEndTime.getTime() - 60 * 60 * 1000); // 1 hour before
    const windowEnd = new Date(slotEndTime.getTime() + 60 * 60 * 1000); // 1 hour after

    // Check if current time is within valid window
    if (now < windowStart) {
      const timeUntilWindow = Math.ceil((windowStart.getTime() - now.getTime()) / (60 * 1000));
      toast.error(
        `You can only reschedule 1 hour before the slot ends. Please try again ${timeUntilWindow} minutes before the slot ends.`,
        { duration: 5000 }
      );
      setTimeout(() => onOpenChange(false), 100);
      return false;
    }

    if (now > windowEnd) {
      toast.error(
        'The reschedule window has closed (1 hour after slot ended). Please contact support for assistance.',
        { duration: 5000 }
      );
      setTimeout(() => onOpenChange(false), 100);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.schedule.date) {
      toast.error('Please select a new date');
      return;
    }

    if (!formData.schedule.timeSlot) {
      toast.error('Please select a time slot');
      return;
    }

    // Validate selected time slot is not in the past
    if (isTimeSlotDisabled(formData.schedule.timeSlot)) {
      const slotEndTime = {
        morning: '12:00 PM',
        afternoon: '5:00 PM',
        evening: '9:00 PM'
      };
      const selectedSlot = TIME_SLOTS.find(s => s.value === formData.schedule.timeSlot);
      toast.error(
        `The ${selectedSlot?.label || 'selected'} time slot has already passed for ${new Date(formData.schedule.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}. Please select a future time slot.`,
        { duration: 5000 }
      );
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for rescheduling');
      return;
    }

    if (!formData.reasonCode) {
      toast.error('Please select a reason code');
      return;
    }

    // Validate not selecting the same slot again
    if (currentSchedule && formData.schedule.date === currentSchedule.date && formData.schedule.timeSlot === currentSchedule.timeSlot) {
      toast.error('Please select a different date or time slot. You cannot reschedule to the same slot.', {
        duration: 4000,
      });
      return;
    }

    // Validate new date is not in the past
    const selectedDate = new Date(formData.schedule.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('New schedule date must be today or in the future');
      return;
    }

    try {
      setLoading(true);

      const { providerApi } = await import('@/lib/api/provider');

      // Type cast the formData to match API expectations
      const rescheduleData = {
        schedule: {
          date: formData.schedule.date,
          timeSlot: formData.schedule.timeSlot as 'morning' | 'afternoon' | 'evening',
          preferredTime: formData.schedule.preferredTime || undefined,
        },
        reason: formData.reason,
        reasonCode: formData.reasonCode as 'cannot_reach_location' | 'traffic_emergency' | 'personal_emergency' | 'customer_unavailable' | 'weather_conditions' | 'other',
        proof: formData.proof || undefined,
      };

      const response = await providerApi.rescheduleService(requestId, rescheduleData) as any;

      // Handle different response structures
      const responseData = response?.data || response;

      if (responseData?.success || response?.success) {
        toast.success(responseData?.message || response?.message || 'Service request rescheduled successfully');
        onOpenChange(false);
        onRescheduleSuccess();
      } else {
        const errorMsg = responseData?.message || response?.message || 'Failed to reschedule service request';
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Reschedule error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reschedule service request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canReschedule = status === 'assigned' || status === 'in_progress';

  // Check if a time slot is disabled based on current time
  const isTimeSlotDisabled = (slotValue: string): boolean => {
    const selectedDate = formData.schedule.date;
    if (!selectedDate) return false;

    const scheduleDate = new Date(selectedDate);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only check time slots for today
    const isToday = scheduleDate.toDateString() === today.toDateString();

    if (!isToday) {
      return false; // All slots available for future dates
    }

    const getSlotTimes = (timeSlot: string): { startHour: number; endHour: number } => {
      switch (timeSlot) {
        case 'morning': return { startHour: 6, endHour: 12 }; // 6 AM - 12 PM
        case 'afternoon': return { startHour: 12, endHour: 17 }; // 12 PM - 5 PM
        case 'evening': return { startHour: 17, endHour: 21 }; // 5 PM - 9 PM
        default: return { startHour: 12, endHour: 17 };
      }
    };

    const slotTimes = getSlotTimes(slotValue);
    const slotEndTime = new Date(scheduleDate);
    slotEndTime.setHours(slotTimes.endHour, 0, 0, 0);

    // Time remaining until slot ends (in milliseconds)
    const timeRemaining = slotEndTime.getTime() - now.getTime();
    const oneHourInMs = 60 * 60 * 1000;

    // Disable slot if less than 1 hour remaining
    return timeRemaining < oneHourInMs;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg md:max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[70vh]">
        <DialogHeader className="space-y-1.5 sm:space-y-2 md:space-y-3 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 pr-2">Reschedule Service Request</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
            {canReschedule
              ? 'Select a new date and time slot for this service request'
              : 'This request cannot be rescheduled in its current status'}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* Current Schedule Info */}
            {currentSchedule && (
              <div className="p-2.5 sm:p-3 md:p-4 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg sm:rounded-xl">
                <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-emerald-900 mb-1 sm:mb-1.5">Current Schedule</p>
                <p className="text-[11px] sm:text-xs md:text-sm text-emerald-700 leading-snug">
                  {new Date(currentSchedule.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {' • '}
                  <span className="capitalize">{currentSchedule.timeSlot}</span>
                </p>
              </div>
            )}

            {/* New Date */}
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="date" className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700">
                New Date <span className="text-red-500">*</span>
              </Label>
              <CalendarFilter
                value={formData.schedule.date}
                onChange={(value) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, date: value }
                })}
                placeholder="Select new date"
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="timeSlot" className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700">
                Time Slot <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.schedule.timeSlot}
                onValueChange={(value) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, timeSlot: value }
                })}
                disabled={!canReschedule}
              >
                <SelectTrigger className="h-9 sm:h-10 md:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-emerald-200 rounded-lg sm:rounded-xl max-h-[60vh] overflow-y-auto">
                  {TIME_SLOTS.map((slot) => {
                    // Only mark as "Current" if it matches BOTH date AND time slot of current schedule
                    const isCurrentSlot = currentSchedule &&
                      formData.schedule.date === currentSchedule.date &&
                      slot.value === currentSchedule.timeSlot;

                    const isPastSlot = isTimeSlotDisabled(slot.value);
                    const isDisabled = isCurrentSlot || isPastSlot;

                    return (
                      <SelectItem
                        key={slot.value}
                        value={slot.value}
                        disabled={isDisabled}
                        className={isDisabled
                          ? "opacity-50 cursor-not-allowed text-xs sm:text-sm md:text-base py-2.5 sm:py-3"
                          : "hover:bg-emerald-50 focus:bg-emerald-100 text-xs sm:text-sm md:text-base py-2.5 sm:py-3"
                        }
                      >
                        {slot.label}
                        {isCurrentSlot && " (Current)"}
                        {isPastSlot && " (Passed)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Time (Optional) */}
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="preferredTime" className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700">
                Preferred Time <span className="text-gray-400 text-[10px] sm:text-xs">(Optional)</span>
              </Label>
              <TimePicker
                value={formData.schedule.preferredTime}
                onChange={(value) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, preferredTime: value }
                })}
                placeholder="Select preferred time"
                timeSlot={formData.schedule.timeSlot as 'morning' | 'afternoon' | 'evening'}
              />
            </div>

            {/* Reason Code */}
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="reasonCode" className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700">
                Reason for Rescheduling <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.reasonCode}
                onValueChange={(value) => setFormData({ ...formData, reasonCode: value })}
                disabled={!canReschedule}
              >
                <SelectTrigger className="h-9 sm:h-10 md:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-emerald-200 rounded-lg sm:rounded-xl max-h-[60vh] overflow-y-auto">
                  {REASON_CODES.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value} className="hover:bg-emerald-50 focus:bg-emerald-100 text-xs sm:text-sm md:text-base py-2.5 sm:py-3">
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detailed Reason */}
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="reason" className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700">
                Detailed Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Please provide more details about why you need to reschedule..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="resize-none border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base min-h-[80px] sm:min-h-[90px]"
                disabled={!canReschedule}
                required
              />
            </div>

            {/* Proof/Notes (Optional) */}
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <Label htmlFor="proof" className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700">
                Additional Notes <span className="text-gray-400 text-[10px] sm:text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="proof"
                placeholder="Any additional information or proof..."
                value={formData.proof}
                onChange={(e) => setFormData({ ...formData, proof: e.target.value })}
                rows={2}
                className="resize-none border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base min-h-[60px] sm:min-h-[70px]"
                disabled={!canReschedule}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex-col sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm md:text-base font-medium flex-1 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canReschedule}
            className="h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-medium flex-1 w-full sm:w-auto text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2 animate-spin" />
                <span className="text-xs sm:text-sm md:text-base">Rescheduling...</span>
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2" />
                <span className="text-xs sm:text-sm md:text-base">Reschedule</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
