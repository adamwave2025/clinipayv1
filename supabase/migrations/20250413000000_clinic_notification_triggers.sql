
-- Function to trigger clinic notifications when payment status changes to refunded or partially_refunded
CREATE OR REPLACE FUNCTION notify_clinic_payment_refund()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  response JSONB;
  clinic_enabled BOOLEAN;
BEGIN
  -- Only trigger on refund status changes
  IF (NEW.status = 'refunded' OR NEW.status = 'partially_refunded') AND 
     (OLD.status <> 'refunded' AND OLD.status <> 'partially_refunded') THEN
    
    -- Check if notifications are enabled for this clinic
    SELECT email_notifications INTO clinic_enabled 
    FROM clinics 
    WHERE id = NEW.clinic_id;
    
    -- Even if disabled, we'll log and continue for diagnostic purposes
    IF clinic_enabled IS NOT TRUE THEN
      RAISE NOTICE 'Clinic % has email notifications disabled for payment %', NEW.clinic_id, NEW.id;
    END IF;
    
    -- Log the refund event
    RAISE NOTICE 'Payment % status changed to %, triggering clinic refund notification', NEW.id, NEW.status;
    
    -- Build notification payload
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'notification_type', 'payment_refund',
      'record_id', NEW.id
    );
    
    -- Call the clinic-notifications edge function
    BEGIN
      SELECT content::jsonb INTO response
      FROM http((
        'POST',
        CONCAT(
          (SELECT value FROM system_settings WHERE key = 'supabase_edge_function_base_url'),
          '/clinic-notifications'
        ),
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', CONCAT('Bearer ', 
            (SELECT value FROM system_settings WHERE key = 'supabase_anon_key')))
        ],
        'application/json',
        payload::text
      )::http_request);
      
      RAISE NOTICE 'Clinic refund notification sent for payment %: %', NEW.id, response;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send clinic refund notification for payment %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger clinic notifications when payment is created with status 'paid'
CREATE OR REPLACE FUNCTION notify_clinic_payment_success()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  response JSONB;
  clinic_enabled BOOLEAN;
BEGIN
  -- Only trigger for payments with 'paid' status
  IF NEW.status = 'paid' THEN
    
    -- Check if notifications are enabled for this clinic
    SELECT email_notifications INTO clinic_enabled 
    FROM clinics 
    WHERE id = NEW.clinic_id;
    
    -- Even if disabled, we'll log and continue for diagnostic purposes
    IF clinic_enabled IS NOT TRUE THEN
      RAISE NOTICE 'Clinic % has email notifications disabled for payment %', NEW.clinic_id, NEW.id;
    END IF;
    
    -- Log the payment success event
    RAISE NOTICE 'Payment % with status paid, triggering clinic success notification', NEW.id;
    
    -- Build notification payload
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'notification_type', 'payment_success',
      'record_id', NEW.id
    );
    
    -- Call the clinic-notifications edge function
    BEGIN
      SELECT content::jsonb INTO response
      FROM http((
        'POST',
        CONCAT(
          (SELECT value FROM system_settings WHERE key = 'supabase_edge_function_base_url'),
          '/clinic-notifications'
        ),
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', CONCAT('Bearer ', 
            (SELECT value FROM system_settings WHERE key = 'supabase_anon_key')))
        ],
        'application/json',
        payload::text
      )::http_request);
      
      RAISE NOTICE 'Clinic success notification sent for payment %: %', NEW.id, response;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send clinic success notification for payment %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for clinic payment notifications
DROP TRIGGER IF EXISTS trigger_clinic_payment_refund ON payments;
CREATE TRIGGER trigger_clinic_payment_refund
  AFTER UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION notify_clinic_payment_refund();

DROP TRIGGER IF EXISTS trigger_clinic_payment_success ON payments;
CREATE TRIGGER trigger_clinic_payment_success
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION notify_clinic_payment_success();
  
-- After update on existing payments (for catching payments that were already processed)
DROP TRIGGER IF EXISTS trigger_clinic_payment_success_update ON payments;
CREATE TRIGGER trigger_clinic_payment_success_update
  AFTER UPDATE OF status ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status <> 'paid')
  EXECUTE FUNCTION notify_clinic_payment_success();
