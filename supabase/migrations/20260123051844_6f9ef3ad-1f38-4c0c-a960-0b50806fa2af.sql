-- Add missing default permissions for employee role
-- These will be disabled by default but configurable by HR
INSERT INTO public.role_permissions (role, permission_key, enabled)
VALUES 
  ('employee', 'page_employees', false),
  ('employee', 'page_branches', false),
  ('employee', 'page_attendance', false),
  ('employee', 'page_positions', false),
  ('employee', 'page_time_schedule', false),
  ('employee', 'page_settings', false),
  ('employee', 'page_reports', false),
  ('employee', 'page_leaves', false),
  ('employee', 'page_payroll', false)
ON CONFLICT DO NOTHING;