
-- Function to find verification by token
CREATE OR REPLACE FUNCTION public.find_verification_by_token(
  p_token TEXT,
  p_user_id UUID
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  verification_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT v.id, v.user_id, v.email, v.verification_token, v.expires_at, v.verified
  FROM public.user_verification v
  WHERE v.verification_token = p_token
  AND v.user_id = p_user_id
  AND v.expires_at > NOW()
  AND v.verified = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update verification status
CREATE OR REPLACE FUNCTION public.update_verification_status(
  p_token TEXT,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.user_verification
  SET verified = true
  WHERE verification_token = p_token
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.find_verification_by_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_verification_by_token TO anon;
GRANT EXECUTE ON FUNCTION public.find_verification_by_token TO service_role;

GRANT EXECUTE ON FUNCTION public.update_verification_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_verification_status TO anon;
GRANT EXECUTE ON FUNCTION public.update_verification_status TO service_role;
