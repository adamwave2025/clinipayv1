
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to generate a payment reference
function generatePaymentReference() {
  // Generate a random alphanumeric string (8 characters)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Add a timestamp to make it unique (last 4 digits of timestamp)
  const timestamp = Date.now().toString();
  const timeComponent = timestamp.substring(timestamp.length - 4);
  
  // Format: PAY-XXXX-YYYY where XXXX is random and YYYY is time-based
  return `PAY-${result}-${timeComponent}`;
}

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

  // Get the stripe webhook secret for payment intents
  const stripeWebhookSecret = Deno.env.get("STRIPE_INTENT_SECRET");
  if (!stripeWebhookSecret) {
    console.error("Missing STRIPE_INTENT_SECRET");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body as text for webhook verification
    const body = await req.text();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Verify the webhook signature using the async method
    let event;
    try {
      // Use constructEventAsync instead of constructEvent
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received event: ${event.type}`);

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      await handlePaymentIntentSucceeded(event.data.object, supabaseClient);
    } else if (event.type === "payment_intent.payment_failed") {
      await handlePaymentIntentFailed(event.data.object, supabaseClient);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Function to handle payment_intent.succeeded events
async function handlePaymentIntentSucceeded(paymentIntent, supabaseClient) {
  console.log("Processing payment_intent.succeeded:", paymentIntent.id);
  console.log("Payment intent details:", JSON.stringify({
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata || {}
  }));
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    const {
      clinicId,
      paymentLinkId,
      requestId,
      paymentReference: existingReference,
      patientName,
      patientEmail,
      patientPhone,
    } = metadata;

    if (!clinicId) {
      console.error("Missing clinicId in payment intent metadata");
      return;
    }

    // Convert the amount from cents to pounds with precision
    const amountInPounds = paymentIntent.amount / 100;
    
    console.log(`Payment for clinic: ${clinicId}, amount: ${amountInPounds} (original: ${paymentIntent.amount} cents)`);
    
    // Generate a payment reference if one doesn't exist
    const paymentReference = existingReference || generatePaymentReference();
    console.log(`Using payment reference: ${paymentReference}`);
    
    // Prepare payment record data
    const paymentData = {
      clinic_id: clinicId,
      amount_paid: amountInPounds,
      paid_at: new Date().toISOString(),
      patient_name: patientName || "Unknown",
      patient_email: patientEmail || null,
      patient_phone: patientPhone || null,
      payment_link_id: paymentLinkId || null,
      payment_ref: paymentReference,
      status: "paid",
      stripe_payment_id: paymentIntent.id,
    };

    console.log("Attempting to insert payment record:", JSON.stringify(paymentData));
    
    // Record the payment in the payments table
    const { data, error } = await supabaseClient
      .from("payments")
      .insert(paymentData)
      .select();

    if (error) {
      console.error("Error inserting payment record:", error);
      console.error("Error details:", JSON.stringify(error));
      throw new Error(`Error recording payment: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error("No data returned from payment insert operation");
      throw new Error("Payment record was not created properly");
    }

    const paymentId = data[0].id;
    console.log(`Payment record created with ID: ${paymentId}`);

    // If this payment was for a payment request, update the request status
    if (requestId) {
      console.log(`Updating payment request: ${requestId}`);
      
      const { error: requestUpdateError } = await supabaseClient
        .from("payment_requests")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_id: paymentId
        })
        .eq("id", requestId);

      if (requestUpdateError) {
        console.error("Error updating payment request:", requestUpdateError);
        console.error("Error details:", JSON.stringify(requestUpdateError));
        // Don't throw error here, we already recorded the payment
      } else {
        console.log(`Payment request ${requestId} marked as paid`);
      }
    }

    console.log("Payment processing completed successfully");
  } catch (error) {
    console.error("Error processing payment intent:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

// Function to handle payment_intent.payment_failed events
async function handlePaymentIntentFailed(paymentIntent, supabaseClient) {
  console.log("Processing payment_intent.payment_failed:", paymentIntent.id);
  console.log("Failed payment intent details:", JSON.stringify({
    id: paymentIntent.id,
    status: paymentIntent.status,
    error: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata || {}
  }));
  
  try {
    // Extract metadata from the payment intent
    const metadata = paymentIntent.metadata || {};
    const {
      clinicId,
      paymentLinkId,
      requestId,
      patientName,
      patientEmail,
      patientPhone,
    } = metadata;

    if (!clinicId) {
      console.error("Missing clinicId in payment intent metadata");
      return;
    }

    // Log the failure reason
    const failureMessage = paymentIntent.last_payment_error?.message || "Unknown failure reason";
    const failureCode = paymentIntent.last_payment_error?.code || "unknown";
    
    console.log(`Payment failed for clinic: ${clinicId}, reason: ${failureMessage}, code: ${failureCode}`);
    
    // Update payment attempt if exists
    if (paymentIntent.id) {
      const { error: attemptUpdateError } = await supabaseClient
        .from("payment_attempts")
        .update({
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("payment_intent_id", paymentIntent.id);

      if (attemptUpdateError) {
        console.error("Error updating payment attempt:", attemptUpdateError);
        console.error("Error details:", JSON.stringify(attemptUpdateError));
      } else {
        console.log(`Payment attempt updated to failed for intent ${paymentIntent.id}`);
      }
    }

    // If this payment was for a payment request, we might want to update it
    if (requestId) {
      console.log(`Payment failed for request: ${requestId}`);
      // You may choose to update the payment request status here if needed
    }

    console.log("Failed payment processing completed");
  } catch (error) {
    console.error("Error processing failed payment intent:", error);
    console.error("Stack trace:", error.stack);
  }
}
