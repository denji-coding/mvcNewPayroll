-- Create employee_schedules table for managing work schedules
CREATE TABLE public.employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_duty_day BOOLEAN DEFAULT true,
  start_time TIME DEFAULT '08:00',
  end_time TIME DEFAULT '17:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "HR can manage schedules" ON public.employee_schedules 
FOR ALL USING (has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "Employees can view own schedule" ON public.employee_schedules 
FOR SELECT USING (employee_id = get_employee_by_user(auth.uid()));

CREATE POLICY "Branch managers can view branch schedules" ON public.employee_schedules 
FOR SELECT USING (
  has_role(auth.uid(), 'branch_manager'::app_role) 
  AND employee_id IN (
    SELECT id FROM public.employees WHERE branch_id = get_user_branch_id(auth.uid())
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_employee_schedules_updated_at
  BEFORE UPDATE ON public.employee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();