
-- Updated resume_payment_plan function to properly reschedule payments from resume date
-- and specify the status to look for
CREATE OR REPLACE FUNCTION public.resume_payment_plan(plan_id uuid, resume_date date, payment_status text DEFAULT 'paused')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  days_paused INTEGER;
  first_paused_date DATE;
  current_schedule RECORD;
  plan_record RECORD;
  payment_interval INTERVAL;
  i INTEGER := 0;
  payment_ids UUID[];
  payment_dates DATE[];
  debug_info JSONB;
BEGIN
  -- Get plan details to determine payment frequency
  SELECT p.payment_frequency INTO plan_record
  FROM plans p
  WHERE p.id = plan_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Plan not found');
  END IF;
  
  -- Determine the interval based on payment frequency
  CASE plan_record.payment_frequency
    WHEN 'weekly' THEN payment_interval := '7 days'::INTERVAL;
    WHEN 'bi-weekly' THEN payment_interval := '14 days'::INTERVAL;
    WHEN 'monthly' THEN payment_interval := '1 month'::INTERVAL;
    ELSE payment_interval := '1 month'::INTERVAL; -- Default to monthly if unknown
  END CASE;
  
  -- IMPORTANT: Use the provided status parameter instead of hardcoding 'pending'
  -- AND fully qualify all column references to avoid ambiguity
  SELECT ARRAY_AGG(ps.id ORDER BY ps.due_date), ARRAY_AGG(ps.due_date ORDER BY ps.due_date)
  INTO payment_ids, payment_dates
  FROM payment_schedule ps
  WHERE ps.plan_id = resume_payment_plan.plan_id AND ps.status = resume_payment_plan.payment_status
  ORDER BY ps.due_date;
  
  -- If there are no payments with the specified status, nothing to reschedule
  IF payment_ids IS NULL OR ARRAY_LENGTH(payment_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No ' || resume_payment_plan.payment_status || ' payments to reschedule',
      'warning', 'Check that plan has ' || resume_payment_plan.payment_status || ' payments to resume',
      'plan_id', resume_payment_plan.plan_id,
      'status_used', resume_payment_plan.payment_status
    );
  END IF;
  
  -- Log for debugging what we're working with
  debug_info := jsonb_build_object(
    'payment_count', ARRAY_LENGTH(payment_ids, 1),
    'first_date', payment_dates[1],
    'resume_date', resume_payment_plan.resume_date,
    'payment_ids', payment_ids,
    'status_used', resume_payment_plan.payment_status
  );
  
  -- Set the first payment to the resume date exactly
  UPDATE payment_schedule ps
  SET due_date = resume_payment_plan.resume_date
  WHERE ps.id = payment_ids[1];
  
  -- Now update subsequent payments based on the frequency interval
  FOR i IN 2..ARRAY_LENGTH(payment_ids, 1) LOOP
    UPDATE payment_schedule ps
    SET due_date = resume_payment_plan.resume_date + ((i-1) * payment_interval)
    WHERE ps.id = payment_ids[i];
  END LOOP;
  
  -- Update the plan's next_due_date
  UPDATE plans p
  SET next_due_date = resume_payment_plan.resume_date
  WHERE p.id = resume_payment_plan.plan_id;
  
  -- Calculate days shifted for reporting
  days_paused := resume_payment_plan.resume_date - payment_dates[1];
  
  result := jsonb_build_object(
    'success', true,
    'days_shifted', days_paused,
    'resume_date', resume_payment_plan.resume_date,
    'payments_rescheduled', ARRAY_LENGTH(payment_ids, 1),
    'status_used', resume_payment_plan.payment_status,
    'debug', debug_info
  );
  
  RETURN result;
END;
$function$;
