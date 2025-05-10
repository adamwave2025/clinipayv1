
import { corsHeaders } from "./utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export async function handleCreatePaymentIntent(req: Request) {
  try {
    const body = await req.json();
    const { amount, clinicId, paymentLinkId, requestId, paymentMethod, planId, planStatus } = body;

    console.log(`Creating payment for clinic ${clinicId}, amount: ${amount}`);
    console.log(`Payment request status: ${requestId ? 'payment request' : 'direct payment'}, Plan ID: ${planId || 'null'}, Plan status: ${planStatus || 'null'}`);

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

    // Fetch the clinic's Stripe account ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Configure Stripe
    const stripe = new Stripe(Deno.env.get("SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Generate consistent payment reference
    // Standard format with CLN- prefix for all payment references
    const paymentReference = `CLN-${Array(6)
      .fill(0)
      .map(() => 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
          Math.floor(Math.random() * 36)
        )
      )
      .join("")}`;
      
    console.log(`Generated payment reference: ${paymentReference}`);

    // Create a PaymentIntent
    // FIX: Remove the amount from transfer_data since we're using application_fee_amount
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
        planStatus: planStatus || ""
      },
      transfer_data: {
        destination: clinic.stripe_account_id,
        // Removed the amount parameter here to avoid the conflict with application_fee_amount
      },
      application_fee_amount: platformFeeAmount,
    });

    console.log(`Payment intent created: ${paymentIntent.id}`);
    console.log(`Payment intent metadata:`, paymentIntent.metadata);

    return new Response(JSON.stringify({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentLinkId,
      requestId,
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
