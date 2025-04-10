
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
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
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the signature from the request
    const signature = req.headers.get("stripe-signature");
    if (!signature && stripeWebhookSecret) {
      throw new Error("No signature provided in the request");
    }

    // Get the raw request body
    const requestBody = await req.text();
    
    let event;
    
    // Verify webhook signature if secret is available
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(requestBody, signature, stripeWebhookSecret);
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      // If no webhook secret, just parse the JSON (less secure, for development only)
      try {
        event = JSON.parse(requestBody);
      } catch (err) {
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
      
      // Check if the capabilities meet the requirements for being active
      // For Express accounts, this typically means checking if charges capability is active
      const isAccountActive = account.charges_enabled && 
                              account.capabilities && 
                              account.capabilities.card_payments === 'active' &&
                              account.capabilities.transfers === 'active';
      
      if (isAccountActive) {
        // Find the clinic by Stripe account ID
        const { data: clinics, error: fetchError } = await supabase
          .from("clinics")
          .select("id")
          .eq("stripe_account_id", account.id);
          
        if (fetchError) {
          throw fetchError;
        }
        
        if (clinics && clinics.length > 0) {
          // Update the clinic's stripe_status to active
          const { error: updateError } = await supabase
            .from("clinics")
            .update({ stripe_status: "active" })
            .eq("stripe_account_id", account.id);
          
          if (updateError) {
            throw updateError;
          }
          
          console.log(`Updated clinic with Stripe account ${account.id} to active status`);
        }
      }
    }

    // Return a success response to Stripe
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (err) {
    console.error("Stripe Webhook Error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
