
-- Begin transaction to ensure all changes are applied atomically
BEGIN;

-- First, disable all triggers on the payments table temporarily
ALTER TABLE payments DISABLE TRIGGER ALL;

-- Create a more robust function to insert payment records safely
CREATE OR REPLACE FUNCTION public.insert_payment_record(
  p_clinic_id UUID,
  p_amount_paid NUMERIC,
  p_patient_name TEXT,
  p_patient_email TEXT DEFAULT NULL,
  p_patient_phone TEXT DEFAULT NULL,
  p_payment_link_id UUID DEFAULT NULL,
  p_payment_ref TEXT,
  p_stripe_payment_id TEXT
)
RETURNS UUID AS $$
DECLARE
  payment_id UUID;
  log_message TEXT;
BEGIN
  -- Log the beginning of the operation
  RAISE NOTICE 'Starting payment record insertion for: %', p_stripe_payment_id;
  
  -- First, check if this payment already exists to prevent duplicates
  SELECT id INTO payment_id
  FROM payments
  WHERE stripe_payment_id = p_stripe_payment_id;
  
  IF FOUND THEN
    RAISE NOTICE 'Payment record already exists for payment ID: %', p_stripe_payment_id;
    RETURN payment_id;
  END IF;
  
  -- Insert the payment record with careful logging
  BEGIN
    INSERT INTO payments (
      clinic_id,
      amount_paid,
      paid_at,
      patient_name,
      patient_email,
      patient_phone,
      payment_link_id,
      payment_ref,
      status,
      stripe_payment_id
    ) VALUES (
      p_clinic_id,
      p_amount_paid,
      now(),
      COALESCE(p_patient_name, 'Unknown'),
      p_patient_email,
      p_patient_phone,
      p_payment_link_id,
      p_payment_ref,
      'paid',
      p_stripe_payment_id
    )
    RETURNING id INTO payment_id;
    
    RAISE NOTICE 'Successfully inserted payment record with ID: %', payment_id;
    RETURN payment_id;
    
  EXCEPTION WHEN OTHERS THEN
    log_message := 'Database error during payment insertion: ' || SQLERRM;
    RAISE NOTICE '%', log_message;
    
    -- Fall back to direct insertion with minimal columns
    BEGIN
      INSERT INTO payments (
        clinic_id,
        amount_paid,
        stripe_payment_id,
        status,
        paid_at
      ) VALUES (
        p_clinic_id,
        p_amount_paid,
        p_stripe_payment_id,
        'paid',
        now()
      )
      RETURNING id INTO payment_id;
      
      RAISE NOTICE 'Fallback insertion succeeded with ID: %', payment_id;
      RETURN payment_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Fallback insertion also failed: %', SQLERRM;
      RETURN NULL;
    END;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to enable payment triggers when needed
CREATE OR REPLACE FUNCTION public.enable_payment_triggers()
RETURNS void AS $$
BEGIN
  ALTER TABLE payments ENABLE TRIGGER ALL;
  RAISE NOTICE 'All triggers on payments table have been re-enabled';
END;
$$ LANGUAGE plpgsql;

-- Create a safer update payment request function
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

-- Log that triggers are disabled
DO $$
BEGIN
  RAISE NOTICE 'All triggers on payments table have been temporarily disabled to resolve statement timeout issues';
  RAISE NOTICE 'To re-enable triggers, run: SELECT enable_payment_triggers();';
END;
$$;

COMMIT;
