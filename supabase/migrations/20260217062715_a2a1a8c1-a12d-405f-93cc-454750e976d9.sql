
-- Create leave_types table for managing leave type definitions
CREATE TABLE public.leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  default_credits NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

-- Everyone can read leave types
CREATE POLICY "Anyone can view leave types"
  ON public.leave_types FOR SELECT
  USING (true);

-- Only hr_admin can manage leave types
CREATE POLICY "HR admins can insert leave types"
  ON public.leave_types FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can update leave types"
  ON public.leave_types FOR UPDATE
  USING (public.has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can delete leave types"
  ON public.leave_types FOR DELETE
  USING (public.has_role(auth.uid(), 'hr_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_leave_types_updated_at
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default leave types
INSERT INTO public.leave_types (name, default_credits, description) VALUES
  ('Emergency Leave', 2, 'For unexpected emergencies'),
  ('Sick Leave', 2, 'For illness or medical appointments'),
  ('Vacation Leave', 1, 'For personal vacation time'),
  ('Maternity/Paternity Leave', 0, 'For maternity or paternity purposes');
