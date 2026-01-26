-- Add avatar_url column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for employee avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-avatars', 'employee-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee avatars
CREATE POLICY "Anyone can view employee avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'employee-avatars');

CREATE POLICY "HR can upload employee avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-avatars' 
  AND has_role(auth.uid(), 'hr_admin'::app_role)
);

CREATE POLICY "HR can update employee avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'employee-avatars' 
  AND has_role(auth.uid(), 'hr_admin'::app_role)
);

CREATE POLICY "HR can delete employee avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-avatars' 
  AND has_role(auth.uid(), 'hr_admin'::app_role)
);