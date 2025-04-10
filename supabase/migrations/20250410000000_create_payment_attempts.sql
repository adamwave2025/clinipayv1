
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  payment_link_id UUID REFERENCES public.payment_links(id),
  payment_request_id UUID REFERENCES public.payment_requests(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS payment_attempts_clinic_id_idx ON public.payment_attempts (clinic_id);
CREATE INDEX IF NOT EXISTS payment_attempts_payment_link_id_idx ON public.payment_attempts (payment_link_id);
CREATE INDEX IF NOT EXISTS payment_attempts_payment_request_id_idx ON public.payment_attempts (payment_request_id);
CREATE INDEX IF NOT EXISTS payment_attempts_payment_intent_id_idx ON public.payment_attempts (payment_intent_id);

-- Create trigger to update updated_at field
CREATE OR REPLACE FUNCTION update_payment_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_attempts_updated_at_trigger ON payment_attempts;
CREATE TRIGGER update_payment_attempts_updated_at_trigger
BEFORE UPDATE ON payment_attempts
FOR EACH ROW
EXECUTE FUNCTION update_payment_attempts_updated_at();
