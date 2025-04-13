
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

// Initialize a Stripe client with better error handling
export function initStripe() {
  const secretKey = Deno.env.get("SECRET_KEY");
  if (!secretKey) {
    const error = new Error("Missing Stripe secret key");
    console.error(error.message);
    throw error;
  }
  
  try {
    return new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  } catch (error) {
    console.error("Failed to initialize Stripe client:", error);
    throw new Error(`Stripe initialization failed: ${error.message}`);
  }
}

// Initialize a Supabase client with connection testing
export async function initSupabase() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    const error = new Error("Missing Supabase credentials");
    console.error(error.message);
    throw error;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test the connection
    const { data, error } = await supabase.from("system_settings").select("key").limit(1);
    
    if (error) {
      console.error("Supabase connection test failed:", error);
      throw new Error(`Database connection error: ${error.message}`);
    }
    
    console.log("Supabase connection successful:", data ? "Data returned" : "No data returned but query succeeded");
    return supabase;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    throw new Error(`Supabase initialization failed: ${error.message}`);
  }
}

// Function to safely convert amount from cents to the appropriate decimal value
export function convertCentsToCurrency(amountInCents) {
  if (typeof amountInCents !== 'number') {
    console.warn(`Invalid amount provided: ${amountInCents}, type: ${typeof amountInCents}`);
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

// Function to execute an operation with retries and exponential backoff
export async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // Increase delay for next attempt (exponential backoff)
        delayMs *= 2;
      }
    }
  }
  
  throw lastError;
}

// Function to validate payment intent data
export function validatePaymentIntent(paymentIntent) {
  if (!paymentIntent) {
    throw new Error("Payment intent is null or undefined");
  }
  
  if (!paymentIntent.id) {
    throw new Error("Payment intent missing ID");
  }
  
  if (!paymentIntent.metadata || !paymentIntent.metadata.clinicId) {
    throw new Error("Payment intent missing required metadata: clinicId");
  }
  
  if (typeof paymentIntent.amount !== 'number') {
    throw new Error(`Invalid amount in payment intent: ${paymentIntent.amount}`);
  }
  
  return true;
}

// Helper to check if environment is properly configured
export function checkEnvironment() {
  const requiredEnvVars = [
    "SECRET_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_INTENT_SECRET"
  ];
  
  const missing = requiredEnvVars.filter(v => !Deno.env.get(v));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// Function to handle database errors with detailed logging
export function handleDatabaseError(error, context) {
  const errorDetails = {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    context
  };
  
  console.error(`Database error in ${context}:`, JSON.stringify(errorDetails, null, 2));
  
  // Add additional diagnostic info if available
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }
  
  return errorDetails;
}
