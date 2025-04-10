
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Get Stripe secret key and webhook secret from environment variables
    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      console.error("Missing Stripe secret key");
      throw new Error("Missing Stripe secret key");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the signature from the request
    const signature = req.headers.get("stripe-signature");
    
    // Detailed logging for diagnosis
    console.log(`Webhook secret available: ${!!stripeWebhookSecret}`);
    console.log(`Signature provided: ${!!signature}`);
    
    if (!signature && stripeWebhookSecret) {
      console.error("No stripe-signature header provided in the request");
      throw new Error("No signature provided in the request");
    }

    // Get the raw request body
    const requestBody = await req.text();
    console.log(`Request body length: ${requestBody.length} characters`);
    
    let event;
    
    // Verify webhook signature if secret is available
    if (stripeWebhookSecret && signature) {
      try {
        // Log partial signature and secret for debugging (masked for security)
        console.log(`Signature prefix: ${signature.substring(0, 10)}...`);
        console.log(`Secret key prefix: ${stripeWebhookSecret.substring(0, 5)}...`);
        
        event = stripe.webhooks.constructEvent(requestBody, signature, stripeWebhookSecret);
        console.log("Signature verification successful!");
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        console.error("Details:", err);
        
        // Return proper error response with CORS headers
        return new Response(JSON.stringify({ 
          error: "Invalid signature",
          message: err.message
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      // If no webhook secret, just parse the JSON (less secure, for development only)
      try {
        console.log("No signature verification - parsing JSON directly");
        event = JSON.parse(requestBody);
      } catch (err) {
        console.error(`Failed to parse payload: ${err.message}`);
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle different event types
    if (event.type === 'account.updated') {
      const account = event.data.object;
      console.log(`Received account.updated event for account: ${account.id}`);
      
      // Check if the capabilities meet the requirements for being active
      // For Express accounts, this typically means checking if charges capability is active
      const isAccountActive = account.charges_enabled && 
                              account.capabilities && 
                              account.capabilities.card_payments === 'active' &&
                              account.capabilities.transfers === 'active';
      
      console.log(`Account status - charges_enabled: ${account.charges_enabled}, card_payments: ${account.capabilities?.card_payments}, transfers: ${account.capabilities?.transfers}`);
      console.log(`Account active status: ${isAccountActive}`);
      
      if (isAccountActive) {
        // Find the clinic by Stripe account ID
        const { data: clinics, error: fetchError } = await supabase
          .from("clinics")
          .select("id")
          .eq("stripe_account_id", account.id);
          
        if (fetchError) {
          console.error(`Error fetching clinic: ${fetchError.message}`);
          throw fetchError;
        }
        
        console.log(`Found ${clinics?.length || 0} clinics with Stripe account ID: ${account.id}`);
        
        if (clinics && clinics.length > 0) {
          // Update the clinic's stripe_status to active
          const { error: updateError } = await supabase
            .from("clinics")
            .update({ stripe_status: "active" })
            .eq("stripe_account_id", account.id);
          
          if (updateError) {
            console.error(`Error updating clinic: ${updateError.message}`);
            throw updateError;
          }
          
          console.log(`Updated clinic with Stripe account ${account.id} to active status`);
        }
      } else {
        console.log(`Account ${account.id} is not fully active yet, no status update needed`);
      }
    } else {
      console.log(`Ignoring event type: ${event.type} (not handled)`);
    }

    // Return a success response to Stripe
    console.log("Webhook processing completed successfully");
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (err) {
    console.error("Stripe Webhook Error:", err);
    return new Response(JSON.stringify({
      error: err.message,
      stack: err.stack
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
