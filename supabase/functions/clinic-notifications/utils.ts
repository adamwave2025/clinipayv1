
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MAX_RETRIES, INITIAL_RETRY_DELAY, sleep } from "./config.ts";

// Create a Supabase client with admin privileges
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Retry a function with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY,
  onRetry?: (error: Error, attempt: number) => void
): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      if (onRetry) {
        onRetry(error, attempt);
      }
      
      // Exponential backoff with jitter
      delay = delay * 2 * (0.5 + Math.random() * 0.5);
      await sleep(delay);
    }
  }
}

// Find a payment record by ID with related clinic info
export async function findPaymentRecord(
  paymentId: string,
  supabaseClient: any
) {
  console.log(`Finding payment record with ID: ${paymentId}`);
  const { data, error } = await supabaseClient
    .from("payments")
    .select(`
      *,
      clinics:clinic_id (
        clinic_name,
        email,
        phone,
        email_notifications,
        sms_notifications
      )
    `)
    .eq("id", paymentId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching payment record:", error);
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
  
  if (!data) {
    console.error(`No payment found with ID: ${paymentId}`);
    throw new Error(`No payment found with ID: ${paymentId}`);
  }
  
  return data;
}
