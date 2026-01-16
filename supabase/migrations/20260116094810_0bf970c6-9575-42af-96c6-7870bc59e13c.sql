-- Create password_reset_tokens table
CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temp_password_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (only edge function with service role can access)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Add must_change_password column to profiles
ALTER TABLE public.profiles ADD COLUMN must_change_password boolean DEFAULT false;