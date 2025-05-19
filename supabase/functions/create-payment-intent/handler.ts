
import { corsHeaders, initStripe, initSupabase, validatePaymentAmount, generatePaymentReference } from "./utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export async function handleCreatePaymentIntent(req: Request) {
  try {
    const body = await req.json();
    const { amount, clinicId, paymentLinkId, requestId, paymentMethod, planId, planStatus, payment_schedule_id } = body;

    console.log(`Creating payment for clinic ${clinicId}, amount: ${amount}`);
    console.log(`Payment request status: ${requestId ? 'payment request' : 'direct payment'}, Plan ID: ${planId || 'null'}, Plan status: ${planStatus || 'null'}`);
    
    // Log payment_schedule_id if provided
    if (payment_schedule_id) {
      console.log(`Payment for payment schedule: ${payment_schedule_id}`);
    }

    // Validate the amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      console.error(`Invalid amount provided: ${amount}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid amount" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    if (!clinicId) {
      console.error("No clinic ID provided");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Clinic ID is required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Initialize Supabase using the utility function
    const supabase = initSupabase();

    // Get clinic details
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("stripe_account_id, stripe_status")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinic) {
      console.error("Error fetching clinic:", clinicError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Clinic not found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404
      });
    }

    if (clinic.stripe_status !== "connected" || !clinic.stripe_account_id) {
      console.error("Clinic is not connected to Stripe");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment processing not available for this clinic" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Get the platform fee percentage from the database
    const { data: platformFeeData, error: platformFeeError } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "platform_fee_percentage")
      .single();
    
    let platformFeePercent = 3; // Default to 3%
    if (!platformFeeError && platformFeeData) {
      platformFeePercent = parseFloat(platformFeeData.value);
      console.log(`Found platform fee in database: ${platformFeePercent}%`);
    } else {
      console.log(`Using default platform fee: ${platformFeePercent}%`);
    }
    
    // Calculate platform fee (in cents)
    const platformFeeAmount = Math.round((amount * platformFeePercent) / 100);
    console.log(`Platform fee: ${platformFeePercent}%, Platform fee amount: ${platformFeeAmount}`);

    // Initialize Stripe using the utility function
    const stripe = initStripe();

    // Generate payment reference using the utility function
    const paymentReference = generatePaymentReference();
    console.log(`Generated payment reference: ${paymentReference}`);

    // Validate the payment amount for additional security
    if (!validatePaymentAmount(amount)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Payment amount validation failed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    // Create a PaymentIntent with payment_schedule_id in the metadata if provided
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "gbp",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        clinicId,
        paymentLinkId: paymentLinkId || "",
        requestId: requestId || "",
        platformFeePercent: platformFeePercent.toString(),
        paymentReference,
        patientName: paymentMethod?.billing_details?.name || "",
        patientEmail: paymentMethod?.billing_details?.email || "",
        patientPhone: paymentMethod?.billing_details?.phone || "",
        customAmount: body.customAmount?.toString() || "",
        planId: planId || "",
        planStatus: planStatus || "",
        payment_schedule_id: payment_schedule_id || "", // Include payment_schedule_id in metadata
      },
      transfer_data: {
        destination: clinic.stripe_account_id,
      },
      application_fee_amount: platformFeeAmount,
    });

    console.log(`Payment intent created: ${paymentIntent.id}`);
    console.log(`Payment intent metadata:`, paymentIntent.metadata);
    
    // If we have a payment_schedule_id, log payment activity now, using the payment reference
    if (payment_schedule_id && planId) {
      try {
        // First get patient details from the plan
        const { data: planData } = await supabase
          .from("plans")
          .select("patient_id")
          .eq("id", planId)
          .single();
          
        if (planData) {
          console.log(`Recording payment activity for payment schedule ${payment_schedule_id}`);
          
          // Log payment activity to the payment_activity table
          await supabase.from("payment_activity").insert({
            payment_link_id: paymentLinkId,
            patient_id: planData.patient_id,
            clinic_id: clinicId,
            action_type: 'card_payment_initiated',
            plan_id: planId,
            details: {
              payment_id: payment_schedule_id,
              amount: amount,
              initiated_at: new Date().toISOString(),
              payment_method: 'card',
              payment_ref: paymentReference,
              stripe_payment_intent_id: paymentIntent.id
            }
          });
          
          console.log(`Payment activity recorded with payment_ref: ${paymentReference}`);
        } else {
          console.warn(`Could not find patient_id for plan ${planId}`);
        }
      } catch (activityError) {
        console.error("Error recording payment activity:", activityError);
        // Non-critical error, continue with payment intent creation
      }
    }

    return new Response(JSON.stringify({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentLinkId,
      requestId,
      paymentReference, // Return the payment reference to the client
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Failed to process payment" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
}
