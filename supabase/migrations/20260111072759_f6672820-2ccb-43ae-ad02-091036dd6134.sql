-- Create role_permissions table for dynamic permission management
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission_key)
);

-- Enable Row Level Security
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- HR admins can manage all permissions
CREATE POLICY "HR can manage permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- All authenticated users can read permissions to check their own access
CREATE POLICY "Users can read permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for all roles
INSERT INTO public.role_permissions (role, permission_key, enabled) VALUES
  -- HR Admin permissions (all enabled)
  ('hr_admin', 'page_dashboard', true),
  ('hr_admin', 'page_employees', true),
  ('hr_admin', 'page_branches', true),
  ('hr_admin', 'page_attendance', true),
  ('hr_admin', 'page_leaves', true),
  ('hr_admin', 'page_payroll', true),
  ('hr_admin', 'page_reports', true),
  ('hr_admin', 'page_settings', true),
  ('hr_admin', 'page_clock_inout', true),
  
  -- Branch Manager permissions
  ('branch_manager', 'page_dashboard', true),
  ('branch_manager', 'page_employees', true),
  ('branch_manager', 'page_attendance', true),
  ('branch_manager', 'page_leaves', true),
  ('branch_manager', 'page_payroll', true),
  ('branch_manager', 'page_reports', true),
  ('branch_manager', 'page_clock_inout', false),
  
  -- Employee permissions
  ('employee', 'page_dashboard', true),
  ('employee', 'page_leaves', true),
  ('employee', 'page_payroll', true),
  ('employee', 'page_clock_inout', true),
  ('employee', 'page_my_attendance', true);