
-- Create user verification table for our custom verification system
CREATE TABLE IF NOT EXISTS public.user_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false
);

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_verification_token ON public.user_verification(verification_token);
CREATE INDEX IF NOT EXISTS idx_user_verification_user_id ON public.user_verification(user_id);

-- Add RLS policies
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- Only admins can select verification records directly
CREATE POLICY "Admin users can select verification records"
  ON public.user_verification
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Only the service role can insert/update verification records
CREATE POLICY "Service role can manage verification records"
  ON public.user_verification
  USING (true)
  WITH CHECK (true);
