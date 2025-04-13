
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature"
};

// Function to generate a payment reference
export function generatePaymentReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${timestamp.substring(timestamp.length - 4)}-${randomPart}`;
}

// Initialize a Stripe client
export function initStripe() {
  return new Stripe(Deno.env.get("SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
  });
}

// Initialize a Supabase client
export function initSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}
