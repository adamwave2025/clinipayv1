
-- Create a database function to update payment attempt status
CREATE OR REPLACE FUNCTION public.update_payment_attempt_status(
  attempt_id UUID,
  new_status TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.payment_attempts
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
