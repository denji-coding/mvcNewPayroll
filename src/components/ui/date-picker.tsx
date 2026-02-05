import * as React from "react";
import { format, setMonth, setYear } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disabledDates?: (date: Date) => boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  disabledDates,
}: DatePickerProps) {
  const [calendarDate, setCalendarDate] = React.useState<Date>(date || new Date());

  const handleMonthChange = (month: string) => {
    const newDate = setMonth(calendarDate, parseInt(month));
    setCalendarDate(newDate);
  };

  const handleYearChange = (increment: number) => {
    const newDate = setYear(calendarDate, calendarDate.getFullYear() + increment);
    setCalendarDate(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal overflow-hidden",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{date ? format(date, "MMM d, yyyy") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleYearChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Select
              value={calendarDate.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="h-7 w-[110px] text-xs font-medium focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm font-medium">{calendarDate.getFullYear()}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleYearChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          month={calendarDate}
          onMonthChange={setCalendarDate}
          disabled={disabledDates}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DateInputProps) {
  const date = value ? new Date(value + 'T00:00:00') : undefined;

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      onChange(format(newDate, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
  };

  return (
    <DatePicker
      date={date}
      onDateChange={handleDateChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
