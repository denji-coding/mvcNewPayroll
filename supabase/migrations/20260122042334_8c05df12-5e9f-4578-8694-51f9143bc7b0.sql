-- Insert default permission for DTR page
INSERT INTO public.role_permissions (role, permission_key, enabled)
VALUES ('employee', 'page_dtr', true)
ON CONFLICT DO NOTHING;