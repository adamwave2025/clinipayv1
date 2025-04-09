
-- Create a function that will be used to insert verification records
-- This allows us to sidestep the TypeScript type checking issues
CREATE OR REPLACE FUNCTION public.insert_verification(
  p_user_id UUID,
  p_email TEXT,
  p_token TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_verification (
    user_id,
    email,
    verification_token,
    expires_at,
    verified
  ) VALUES (
    p_user_id,
    p_email,
    p_token,
    p_expires_at,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_verification TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_verification TO anon;
GRANT EXECUTE ON FUNCTION public.insert_verification TO service_role;
