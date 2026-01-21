-- Add 4-time schedule columns to employee_schedules
ALTER TABLE public.employee_schedules
ADD COLUMN IF NOT EXISTS morning_start time DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS morning_end time DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS afternoon_start time DEFAULT '13:00:00',
ADD COLUMN IF NOT EXISTS afternoon_end time DEFAULT '17:00:00';

-- Migrate existing data: morning_start = old start_time, afternoon_end = old end_time
UPDATE public.employee_schedules
SET 
  morning_start = COALESCE(start_time, '08:00:00'),
  morning_end = '12:00:00',
  afternoon_start = '13:00:00',
  afternoon_end = COALESCE(end_time, '17:00:00');

-- Add 4-time columns to attendance table
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS morning_in timestamptz,
ADD COLUMN IF NOT EXISTS morning_out timestamptz,
ADD COLUMN IF NOT EXISTS afternoon_in timestamptz,
ADD COLUMN IF NOT EXISTS afternoon_out timestamptz;

-- Migrate existing attendance data
UPDATE public.attendance
SET 
  morning_in = time_in,
  afternoon_out = time_out
WHERE morning_in IS NULL AND time_in IS NOT NULL;