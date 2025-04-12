
-- Function to trigger notifications when payment status changes to refunded or partially_refunded
CREATE OR REPLACE FUNCTION notify_payment_refund()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  response JSONB;
BEGIN
  -- Only trigger on refund status changes
  IF (NEW.status = 'refunded' OR NEW.status = 'partially_refunded') AND 
     (OLD.status <> 'refunded' AND OLD.status <> 'partially_refunded') THEN
    
    -- Log the refund event
    RAISE NOTICE 'Payment % status changed to %, triggering refund notification', NEW.id, NEW.status;
    
    -- Build notification payload
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'notification_type', 'payment_refund',
      'record_id', NEW.id
    );
    
    -- Call the patient-notifications edge function
    BEGIN
      SELECT content::jsonb INTO response
      FROM http((
        'POST',
        CONCAT(
          (SELECT value FROM system_settings WHERE key = 'supabase_edge_function_base_url'),
          '/patient-notifications'
        ),
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', CONCAT('Bearer ', 
            (SELECT value FROM system_settings WHERE key = 'supabase_anon_key')))
        ],
        'application/json',
        payload::text
      )::http_request);
      
      RAISE NOTICE 'Refund notification sent for payment %: %', NEW.id, response;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send refund notification for payment %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger notifications when payment is created with status 'paid'
CREATE OR REPLACE FUNCTION notify_payment_success()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  response JSONB;
BEGIN
  -- Only trigger for new payments with 'paid' status
  IF NEW.status = 'paid' THEN
    
    -- Log the payment success event
    RAISE NOTICE 'New payment % created with status paid, triggering success notification', NEW.id;
    
    -- Build notification payload
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'notification_type', 'payment_success',
      'record_id', NEW.id
    );
    
    -- Call the patient-notifications edge function
    BEGIN
      SELECT content::jsonb INTO response
      FROM http((
        'POST',
        CONCAT(
          (SELECT value FROM system_settings WHERE key = 'supabase_edge_function_base_url'),
          '/patient-notifications'
        ),
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', CONCAT('Bearer ', 
            (SELECT value FROM system_settings WHERE key = 'supabase_anon_key')))
        ],
        'application/json',
        payload::text
      )::http_request);
      
      RAISE NOTICE 'Success notification sent for payment %: %', NEW.id, response;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send success notification for payment %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger notifications when payment request is created
CREATE OR REPLACE FUNCTION notify_payment_request()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  response JSONB;
BEGIN
  -- Only trigger for new payment requests with 'sent' status
  IF NEW.status = 'sent' THEN
    
    -- Log the payment request event
    RAISE NOTICE 'New payment request % created with status sent, triggering request notification', NEW.id;
    
    -- Build notification payload
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'notification_type', 'payment_request',
      'record_id', NEW.id
    );
    
    -- Call the patient-notifications edge function
    BEGIN
      SELECT content::jsonb INTO response
      FROM http((
        'POST',
        CONCAT(
          (SELECT value FROM system_settings WHERE key = 'supabase_edge_function_base_url'),
          '/patient-notifications'
        ),
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', CONCAT('Bearer ', 
            (SELECT value FROM system_settings WHERE key = 'supabase_anon_key')))
        ],
        'application/json',
        payload::text
      )::http_request);
      
      RAISE NOTICE 'Request notification sent for payment request %: %', NEW.id, response;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send request notification for payment request %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Store the Edge Function URL and Anon Key in system settings if they don't exist
INSERT INTO system_settings (key, value)
VALUES 
  ('supabase_edge_function_base_url', 'https://jbtxxlkhiubuzanegtzn.supabase.co/functions/v1')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value)
VALUES 
  ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidHh4bGtoaXVidXphbmVndHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjU3MTIsImV4cCI6MjA1OTcwMTcxMn0.Pe8trGeGMCmJ61zEFbkaPJidKnmxVOWkLExPa-TNn9I')
ON CONFLICT (key) DO NOTHING;

-- Create triggers for payment notifications
DROP TRIGGER IF EXISTS trigger_payment_refund ON payments;
CREATE TRIGGER trigger_payment_refund
  AFTER UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION notify_payment_refund();

DROP TRIGGER IF EXISTS trigger_payment_success ON payments;
CREATE TRIGGER trigger_payment_success
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION notify_payment_success();

-- Create trigger for payment request notifications
DROP TRIGGER IF EXISTS trigger_payment_request ON payment_requests;
CREATE TRIGGER trigger_payment_request
  AFTER INSERT ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION notify_payment_request();

-- Update Supabase config to ensure the patient-notifications function is not requiring JWT
