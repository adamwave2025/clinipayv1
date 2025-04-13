
-- Create a table to track payment webhook processing
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  event_type TEXT,
  payment_intent_id TEXT,
  status TEXT,
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create an index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS payment_webhook_logs_payment_intent_id_idx 
ON public.payment_webhook_logs(payment_intent_id);

-- Create an index on event_id for faster lookups
CREATE INDEX IF NOT EXISTS payment_webhook_logs_event_id_idx 
ON public.payment_webhook_logs(event_id);

-- Create a function to log webhook events
CREATE OR REPLACE FUNCTION public.log_payment_webhook(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payment_intent_id TEXT,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.payment_webhook_logs (
    event_id,
    event_type,
    payment_intent_id,
    status,
    error_message,
    details
  ) VALUES (
    p_event_id,
    p_event_type,
    p_payment_intent_id,
    p_status,
    p_error_message,
    p_details
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_payment_request_status function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_payment_request_status(
  p_request_id UUID,
  p_payment_id UUID,
  p_status TEXT
)
RETURNS boolean AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  UPDATE payment_requests
  SET 
    status = p_status,
    paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END,
    payment_id = p_payment_id
  WHERE id = p_request_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error updating payment request %: %', p_request_id, SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create or update the function to directly query the database connection health
CREATE OR REPLACE FUNCTION public.check_db_connection()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'success', true,
    'timestamp', now(),
    'message', 'Database connection is healthy'
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'timestamp', now(),
    'error', SQLERRM,
    'message', 'Database connection check failed'
  );
END;
$$ LANGUAGE plpgsql;
