-- Create settings table for terminal configuration
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Everyone can view settings"
ON public.settings
FOR SELECT
USING (true);

-- Only HR can modify settings
CREATE POLICY "HR can manage settings"
ON public.settings
FOR ALL
USING (has_role(auth.uid(), 'hr_admin'::app_role));

-- Insert default terminal settings
INSERT INTO public.settings (key, value) VALUES 
('terminal', '{"work_start_time": "08:00", "work_end_time": "17:00", "grace_period_minutes": 0, "allow_manual_entry": true}'::jsonb);

-- Add trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add medical_certificate_url column to leave_requests
ALTER TABLE public.leave_requests 
ADD COLUMN medical_certificate_url text;

-- Create storage bucket for medical certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-certificates', 'medical-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for medical certificates
CREATE POLICY "Users can upload their own medical certificates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'medical-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own medical certificates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'medical-certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "HR can view all medical certificates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'medical-certificates' AND has_role(auth.uid(), 'hr_admin'::app_role));