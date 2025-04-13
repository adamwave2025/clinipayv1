
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
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("Stripe webhook received at:", new Date().toISOString());
    
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

    // Extract signature from header
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
        
        // Use constructEventAsync instead of constructEvent
        event = await stripe.webhooks.constructEventAsync(requestBody, signature, stripeWebhookSecret);
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
    console.log(`Event ID: ${event.id}`);
    console.log(`Event created at: ${new Date(event.created * 1000).toISOString()}`);

    // Process the webhook asynchronously as a background task
    const processWebhook = async () => {
      try {
        // Handle different event types
        if (event.type === 'account.updated') {
          const account = event.data.object;
          console.log(`Received account.updated event for account: ${account.id}`);
          
          // Log the entire account object to help debug (excluding sensitive data)
          console.log("Account data:", {
            id: account.id,
            metadata: account.metadata,
            details_submitted: account.details_submitted,
            business_type: account.business_type,
            business_profile: account.business_profile
          });
          
          // Check if details_submitted is true
          if (account.details_submitted) {
            console.log(`Account ${account.id} has submitted details`);
            
            let clinicId;
            
            // Check if clinic_id is stored in metadata (preferred approach)
            if (account.metadata && account.metadata.clinic_id) {
              clinicId = account.metadata.clinic_id;
              console.log(`Found clinic_id ${clinicId} in account metadata`);
            } else {
              // If clinic_id is not in metadata, try to find the clinic by Stripe account ID
              console.log(`No clinic_id in metadata, falling back to finding clinic by account ID`);
              const { data: clinics, error: fetchError } = await supabaseClient
                .from("clinics")
                .select("id")
                .eq("stripe_account_id", account.id);
                
              if (fetchError) {
                console.error(`Error fetching clinic: ${fetchError.message}`);
                throw fetchError;
              }
              
              console.log(`Found ${clinics?.length || 0} clinics with Stripe account ID: ${account.id}`);
              
              if (clinics && clinics.length > 0) {
                clinicId = clinics[0].id;
              } else {
                console.error(`No clinic found for Stripe account ID: ${account.id}`);
                throw new Error(`No clinic found for Stripe account ID: ${account.id}`);
              }
            }
            
            // Update the clinic's record
            const { error: updateError } = await supabaseClient
              .from("clinics")
              .update({ 
                stripe_account_id: account.id,
                stripe_status: "connected" 
              })
              .eq("id", clinicId);
            
            if (updateError) {
              console.error(`Error updating clinic: ${updateError.message}`);
              throw updateError;
            }
            
            console.log(`Successfully updated clinic ${clinicId} to connected status`);
          } else {
            console.log(`Account ${account.id} has not submitted details yet, no update needed`);
          }
        } else if (event.type === 'payment_intent.succeeded') {
          // Handle payment_intent.succeeded events to update payment records and payment requests
          const paymentIntent = event.data.object;
          console.log(`Received payment_intent.succeeded event for payment: ${paymentIntent.id}`);
          
          // Extract metadata from the payment intent
          const metadata = paymentIntent.metadata || {};
          const requestId = metadata.requestId;
          const clinicId = metadata.clinicId;
          const paymentLinkId = metadata.paymentLinkId;
          const patientName = metadata.patientName;
          const patientEmail = metadata.patientEmail;
          const patientPhone = metadata.patientPhone;
          const paymentReference = metadata.paymentReference;
          
          console.log("Payment intent metadata:", metadata);
          
          // Check if there's already a payment record for this payment intent
          const { data: existingPayments, error: paymentsError } = await supabaseClient
            .from("payments")
            .select("id")
            .eq("stripe_payment_id", paymentIntent.id);
            
          if (paymentsError) {
            console.error(`Error checking for existing payment record: ${paymentsError.message}`);
          }
          
          // Only create a payment record if one doesn't already exist
          if (!existingPayments || existingPayments.length === 0) {
            console.log(`No existing payment record found for ${paymentIntent.id}, creating new record`);
            
            try {
              // Convert amount from cents to pounds with precision
              const amountInPounds = paymentIntent.amount / 100;
              console.log(`Converting amount from ${paymentIntent.amount} cents to ${amountInPounds} pounds`);
              
              // Use the stored procedure for safely inserting the payment record
              const { data: paymentId, error: insertError } = await supabaseClient.rpc('insert_payment_record', {
                p_clinic_id: clinicId,
                p_amount_paid: amountInPounds,
                p_patient_name: patientName || "Unknown",
                p_patient_email: patientEmail || null,
                p_patient_phone: patientPhone || null,
                p_payment_link_id: paymentLinkId || null,
                p_payment_ref: paymentReference || generatePaymentReference(),
                p_stripe_payment_id: paymentIntent.id
              });
              
              if (insertError) {
                console.error(`Error creating payment record using stored function: ${insertError.message}`);
                throw insertError;
              }
              
              console.log(`Created payment record successfully with ID: ${paymentId}`);
              
              // If this is a payment request, update the payment_requests table
              if (requestId) {
                console.log(`Updating payment request ${requestId} with payment status`);
                
                const { error: updateError } = await supabaseClient
                  .from("payment_requests")
                  .update({
                    status: "paid",
                    paid_at: new Date().toISOString(),
                    payment_id: paymentId
                  })
                  .eq("id", requestId);
                  
                if (updateError) {
                  console.error(`Error updating payment request: ${updateError.message}`);
                } else {
                  console.log(`Successfully updated payment request ${requestId}`);
                }
              }
            } catch (error) {
              console.error(`Error processing payment record: ${error.message}`);
              throw error;
            }
          } else {
            console.log(`Payment record already exists for payment ${paymentIntent.id}`);
          }
        } else {
          console.log(`Ignoring event type: ${event.type} (not handled)`);
        }
      } catch (error) {
        console.error(`Background webhook processing error: ${error.message}`);
        console.error("Stack trace:", error.stack);
      }
    };

    // Run webhook processing in the background
    if (typeof EdgeRuntime !== 'undefined') {
      EdgeRuntime.waitUntil(processWebhook());
    } else {
      // Fallback for local development
      processWebhook().catch(console.error);
    }

    // Return a success response to Stripe
    console.log("Webhook processing initiated in background");
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

// Helper function to generate a payment reference if none exists
function generatePaymentReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${timestamp.substring(timestamp.length - 4)}-${randomPart}`;
}
