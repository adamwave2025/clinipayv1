
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MAX_RETRIES, INITIAL_RETRY_DELAY, sleep } from "./config.ts";

// Create Supabase client
export function createSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// Retry function with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
  errorHandler?: (error: any, attempt: number) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    if (errorHandler) {
      errorHandler(error, MAX_RETRIES - retries + 1);
    }
    
    await sleep(delay);
    return retryOperation(operation, retries - 1, delay * 2, errorHandler);
  }
}

// Helper function to find a payment record by ID
export async function findPaymentRecord(paymentId: string, supabaseClient: any): Promise<any> {
  console.log(`Looking for payment with ID: ${paymentId} using different search methods`);
  
  try {
    // Try to find by direct ID match
    const { data: directMatch, error: directError } = await supabaseClient
      .from("payments")
      .select(`
        *,
        clinics:clinic_id (
          clinic_name,
          email,
          phone
        )
      `)
      .eq("id", paymentId)
      .maybeSingle();
    
    if (directError) {
      console.error("Error in direct ID search:", directError);
    }
    
    if (directMatch) {
      console.log(`Found payment directly by ID: ${paymentId}`);
      return directMatch;
    }
    
    console.log(`No direct match found, trying stripe_payment_id search for: ${paymentId}`);
    
    // Try to find by stripe_payment_id
    const { data: stripeMatch, error: stripeError } = await supabaseClient
      .from("payments")
      .select(`
        *,
        clinics:clinic_id (
          clinic_name,
          email,
          phone
        )
      `)
      .eq("stripe_payment_id", paymentId)
      .maybeSingle();
    
    if (stripeError) {
      console.error("Error in stripe_payment_id search:", stripeError);
    }
    
    if (stripeMatch) {
      console.log(`Found payment by stripe_payment_id: ${paymentId}`);
      return stripeMatch;
    }
    
    // Try the most recently created payment as a last resort
    console.log("No payment found by either method, checking most recent payments");
    const { data: recentPayments, error: recentError } = await supabaseClient
      .from("payments")
      .select(`
        *,
        clinics:clinic_id (
          clinic_name,
          email,
          phone
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error("Error fetching recent payments:", recentError);
    }
    
    if (recentPayments && recentPayments.length > 0) {
      console.log(`Checking ${recentPayments.length} recent payments`);
      console.log(`Recent payment IDs: ${recentPayments.map(p => p.id).join(', ')}`);
      console.log(`Recent payment stripe IDs: ${recentPayments.map(p => p.stripe_payment_id).join(', ')}`);
    } else {
      console.log("No recent payments found in the last 5 entries");
    }
    
    console.error(`No payment found with ID: ${paymentId} after all search attempts`);
    throw new Error(`No payment found with ID: ${paymentId}`);
  } catch (error) {
    console.error(`Error finding payment record: ${error.message}`);
    throw error;
  }
}
