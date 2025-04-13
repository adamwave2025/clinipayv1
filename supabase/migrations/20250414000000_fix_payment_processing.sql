
-- First, disable all triggers on the payments table
ALTER TABLE payments DISABLE TRIGGER ALL;

-- Create a function to temporarily re-enable triggers for testing
CREATE OR REPLACE FUNCTION enable_payment_triggers()
RETURNS void AS $$
BEGIN
  ALTER TABLE payments ENABLE TRIGGER ALL;
  RAISE NOTICE 'All triggers on payments table have been re-enabled';
END;
$$ LANGUAGE plpgsql;

-- Log that triggers are disabled
DO $$
BEGIN
  RAISE NOTICE 'All triggers on payments table have been temporarily disabled to resolve statement timeout issues';
  RAISE NOTICE 'To re-enable triggers, run: SELECT enable_payment_triggers();';
END;
$$;

-- Create a function to safely insert payment records without triggering notifications
CREATE OR REPLACE FUNCTION insert_payment_record(
  p_clinic_id UUID,
  p_amount_paid NUMERIC,
  p_patient_name TEXT,
  p_patient_email TEXT,
  p_patient_phone TEXT,
  p_payment_link_id UUID,
  p_payment_ref TEXT,
  p_stripe_payment_id TEXT
)
RETURNS UUID AS $$
DECLARE
  payment_id UUID;
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
    p_patient_name,
    p_patient_email,
    p_patient_phone,
    p_payment_link_id,
    p_payment_ref,
    'paid',
    p_stripe_payment_id
  )
  RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$$ LANGUAGE plpgsql;
