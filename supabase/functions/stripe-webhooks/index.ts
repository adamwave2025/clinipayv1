
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Stripe secret key and webhook secret
    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }
    
    // Get request body for webhook verification
    const body = await req.text();
    console.log(`Received Stripe webhook event, body length: ${body.length}`);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });
    
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    
    let event;
    
    // If we have a webhook secret, verify the signature
    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
        console.log(`Verified webhook event: ${event.type}`);
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      // If no webhook secret, parse the event from the body
      try {
        event = JSON.parse(body);
        console.log(`Parsed unverified webhook event: ${event.type}`);
      } catch (err) {
        console.error(`Error parsing webhook payload: ${err.message}`);
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Handle different types of events
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object;
        console.log(`Stripe account updated: ${account.id}`);
        
        // Determine account status
        let status = "pending";
        
        if (account.charges_enabled && account.details_submitted && account.payouts_enabled) {
          status = "connected";
        } else if (account.details_submitted) {
          if (account.requirements?.currently_due?.length > 0) {
            status = "review_pending";
          } else {
            status = "pending_verification";
          }
        }
        
        console.log(`Determined status for account ${account.id}: ${status}`);
        
        // Find the clinic with this Stripe account ID
        const { data: clinics, error: fetchError } = await supabase
          .from("clinics")
          .select("id, stripe_status")
          .eq("stripe_account_id", account.id);
          
        if (fetchError) {
          throw fetchError;
        }
        
        if (!clinics || clinics.length === 0) {
          console.log(`No clinic found with Stripe account ID: ${account.id}`);
          return new Response(JSON.stringify({ status: "no_clinic_found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Update the clinic's Stripe status
        const clinic = clinics[0];
        
        if (clinic.stripe_status !== status) {
          console.log(`Updating clinic ${clinic.id} Stripe status from ${clinic.stripe_status} to ${status}`);
          
          const { error: updateError } = await supabase
            .from("clinics")
            .update({ stripe_status: status })
            .eq("id", clinic.id);
            
          if (updateError) {
            throw updateError;
          }
          
          console.log(`Successfully updated clinic ${clinic.id} Stripe status to ${status}`);
        } else {
          console.log(`Clinic ${clinic.id} already has status ${status}, no update needed`);
        }
        
        return new Response(JSON.stringify({ 
          status: "success", 
          account_id: account.id,
          new_status: status
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(JSON.stringify({ 
          status: "ignored",
          event_type: event.type 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message || "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
