
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSignature = req.headers.get("stripe-signature");

    if (!stripeSignature) {
      return new Response(
        JSON.stringify({ error: "No Stripe signature provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_INTENT_SECRET") || "";
    const stripe = new Stripe(Deno.env.get("SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, stripeSignature, webhookSecret);
    } catch (error) {
      console.error(`Webhook validation error: ${error.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook validation failed: ${error.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received Stripe webhook event: ${event.type}`);

    // Handle the payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      if (!paymentIntent || !paymentIntent.metadata) {
        throw new Error("Invalid payment intent data");
      }

      console.log("Payment Intent Succeeded:", paymentIntent.id);
      console.log("Payment Intent Metadata:", paymentIntent.metadata);

      // Extract important metadata
      const {
        clinicId,
        paymentLinkId,
        paymentReference,
        patientName,
        patientEmail,
        patientPhone,
        payment_schedule_id, // Extract the payment schedule ID from metadata
      } = paymentIntent.metadata;

      if (!clinicId) {
        throw new Error("Missing clinic ID in payment intent metadata");
      }

      // Create a payment record
      const payment = {
        clinic_id: clinicId,
        amount_paid: paymentIntent.amount,
        paid_at: new Date(),
        patient_name: patientName || "Unknown Patient",
        patient_email: patientEmail || null,
        patient_phone: patientPhone || null,
        payment_link_id: paymentLinkId || null,
        payment_ref: paymentReference || paymentIntent.id,
        status: "paid",
        stripe_payment_id: paymentIntent.id,
        net_amount: paymentIntent.amount_received,
        platform_fee: paymentIntent.application_fee_amount,
        payment_schedule_id: payment_schedule_id || null, // Store the payment_schedule_id
      };

      // Insert payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert(payment)
        .select("id")
        .single();

      if (paymentError) {
        console.error("Error creating payment record:", paymentError);
        throw new Error(`Failed to create payment record: ${paymentError.message}`);
      }

      console.log("Created payment record:", paymentData.id);

      // If this payment was for a payment schedule item, update its status
      if (payment_schedule_id) {
        console.log(`Updating payment schedule item: ${payment_schedule_id}`);
        
        // Update the payment schedule item status
        const { error: scheduleError } = await supabase
          .from("payment_schedule")
          .update({ 
            status: "paid", 
            updated_at: new Date() 
          })
          .eq("id", payment_schedule_id);

        if (scheduleError) {
          console.error("Error updating payment schedule:", scheduleError);
          // Don't throw error here - we've already created the payment record
        } else {
          console.log(`Successfully updated payment schedule item ${payment_schedule_id} to paid`);
          
          // Get the plan ID to update plan progress
          const { data: scheduleData } = await supabase
            .from("payment_schedule")
            .select("plan_id")
            .eq("id", payment_schedule_id)
            .single();
            
          if (scheduleData?.plan_id) {
            // Update plan progress
            const planId = scheduleData.plan_id;
            
            // Count paid installments for this plan
            const { data: paidCount } = await supabase
              .from("payment_schedule")
              .select("id", { count: "exact" })
              .eq("plan_id", planId)
              .eq("status", "paid");
              
            // Count total installments for this plan
            const { data: totalCount } = await supabase
              .from("payment_schedule")
              .select("id", { count: "exact" })
              .eq("plan_id", planId);
            
            // Calculate progress percentage
            let progress = 0;
            let paidInstallments = 0;
            
            if (paidCount !== null && totalCount !== null && totalCount > 0) {
              paidInstallments = paidCount;
              progress = Math.round((paidCount / totalCount) * 100);
            }
            
            // Update plan status and progress
            await supabase
              .from("plans")
              .update({ 
                status: progress === 100 ? "completed" : "active",
                progress,
                paid_installments: paidInstallments,
                updated_at: new Date()
              })
              .eq("id", planId);
              
            console.log(`Updated plan ${planId} progress to ${progress}%`);
          }
        }
      }

      // Record this activity
      const activity = {
        payment_link_id: paymentLinkId || null,
        patient_id: null, // We don't have this directly from the webhook
        clinic_id: clinicId,
        action_type: "payment_received",
        performed_at: new Date(),
        details: {
          amount: paymentIntent.amount,
          payment_id: paymentData.id,
          stripe_payment_id: paymentIntent.id,
          payment_method: paymentIntent.payment_method_types?.[0] || "card",
          payment_schedule_id: payment_schedule_id || null,
        },
      };

      const { error: activityError } = await supabase
        .from("payment_activity")
        .insert(activity);

      if (activityError) {
        console.error("Error creating activity record:", activityError);
      }

      return new Response(
        JSON.stringify({ success: true, paymentId: paymentData.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always return a successful response for events we don't handle
    // This acknowledges receipt of the webhook and prevents redelivery
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
