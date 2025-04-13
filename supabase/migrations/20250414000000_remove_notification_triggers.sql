
-- Drop the clinic payment notification triggers that are causing timeouts
DROP TRIGGER IF EXISTS trigger_clinic_payment_refund ON payments;
DROP TRIGGER IF EXISTS trigger_clinic_payment_success ON payments;
DROP TRIGGER IF EXISTS trigger_clinic_payment_success_update ON payments;

-- Drop the patient payment notification triggers as well to be safe
DROP TRIGGER IF EXISTS trigger_payment_refund ON payments;
DROP TRIGGER IF EXISTS trigger_payment_success ON payments;

-- Comment out but keep the notification functions for reference
-- They can be re-enabled later with separate triggers once the payment system is stable
COMMENT ON FUNCTION public.notify_clinic_payment_refund() IS 'Temporarily disabled to fix payment recording issues';
COMMENT ON FUNCTION public.notify_clinic_payment_success() IS 'Temporarily disabled to fix payment recording issues';
COMMENT ON FUNCTION public.notify_payment_refund() IS 'Temporarily disabled to fix payment recording issues';
COMMENT ON FUNCTION public.notify_payment_success() IS 'Temporarily disabled to fix payment recording issues';

-- Log that these changes were made
DO $$
BEGIN
  RAISE NOTICE 'Payment notification triggers removed to fix payment recording timeouts';
END $$;
