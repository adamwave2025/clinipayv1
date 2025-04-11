
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Generate a unique, readable payment reference
export function generatePaymentReference(prefix = "CLN", length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoids confusing chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

// Initialize Stripe client
export function initStripe(): Stripe {
  const stripeSecretKey = Deno.env.get("SECRET_KEY");
  if (!stripeSecretKey) {
    console.error("Missing Stripe secret key");
    throw new Error("Payment processing is not configured properly. Please contact support.");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16"
  });
}

// Initialize Supabase client
export function initSupabase() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    throw new Error("Database connection not configured. Please contact support.");
  }
  return createClient(supabaseUrl, supabaseKey);
}
