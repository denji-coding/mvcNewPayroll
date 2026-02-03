-- Add is_manual column to payroll_records table
ALTER TABLE public.payroll_records 
ADD COLUMN is_manual boolean DEFAULT false;