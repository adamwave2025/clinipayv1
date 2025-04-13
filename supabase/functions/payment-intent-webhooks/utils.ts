
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
  const secretKey = Deno.env.get("SECRET_KEY");
  if (!secretKey) {
    throw new Error("Missing Stripe secret key");
  }
  
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
}

// Initialize a Supabase client
export function initSupabase() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Function to safely convert amount from cents to the appropriate decimal value
export function convertCentsToCurrency(amountInCents) {
  if (typeof amountInCents !== 'number') {
    return 0;
  }
  
  return amountInCents / 100;
}

// Utility function to safely log objects without circular references
export function safeLog(label, obj) {
  try {
    console.log(`${label}:`, JSON.stringify(obj, null, 2));
  } catch (error) {
    console.log(`${label}: [Object could not be stringified]`, 
      Object.keys(obj).reduce((acc, key) => {
        try {
          acc[key] = typeof obj[key];
        } catch (e) {
          acc[key] = 'unknown';
        }
        return acc;
      }, {})
    );
  }
}
