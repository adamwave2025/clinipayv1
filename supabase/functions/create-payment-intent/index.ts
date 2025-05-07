
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, generatePaymentReference, initStripe, initSupabase, validatePaymentAmount } from "./utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing payment request: " + req.url);
    
    // Parse the request body
    const requestData = await req.json();
    console.log("Request body:", JSON.stringify(requestData));
    
    // Validate required fields
    const { amount, clinicId, paymentLinkId, requestId, paymentMethod } = requestData;
    if (!amount || !clinicId) {
      throw new Error("Missing required payment information");
    }
    
    // Log payment information for debugging
    console.log(`Creating payment for clinic ${clinicId}, amount: ${amount}`);
    
    // Validate payment amount to prevent errors
    if (!validatePaymentAmount(amount)) {
      throw new Error("Invalid payment amount");
    }
    
    // Initialize Supabase client
    const supabaseClient = initSupabase();

    // Check for platform fee percentage
    let platformFeePercent = 2; // Default 2%
    try {
      const { data: feeData } = await supabaseClient
        .from("platform_settings")
        .select("stripe_fee_percent")
        .single();

      if (feeData?.stripe_fee_percent) {
        platformFeePercent = feeData.stripe_fee_percent;
        console.log(`Found platform fee in database: ${platformFeePercent}%`);
      }
    } catch (error) {
      console.warn("Could not retrieve platform fee from database, using default");
    }
    
    // Calculate platform fee (amount * percentage / 100)
    const platformFeeAmount = Math.round((amount * platformFeePercent) / 100);
    console.log(`Platform fee: ${platformFeePercent}%, Platform fee amount: ${platformFeeAmount}`);
    
    // Generate a payment reference
    const paymentReference = generatePaymentReference();
    console.log(`Generated payment reference: ${paymentReference}`);
    
    // Create metadata for the payment intent
    const metadata = {
      clinicId,
      paymentLinkId: paymentLinkId || "",
      requestId: requestId || "",
      platformFeePercent: platformFeePercent.toString(),
      paymentReference,
      patientName: paymentMethod?.billing_details?.name || "",
      patientEmail: paymentMethod?.billing_details?.email || "",
      patientPhone: paymentMethod?.billing_details?.phone || "",
      customAmount: requestData.customAmount?.toString() || ""
    };
    console.log("Payment intent metadata:", metadata);
    
    // Initialize Stripe
    const stripe = initStripe();
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount is already in cents
      currency: "gbp",
      metadata,
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: clinicId,
      },
    });
    
    console.log("Payment intent created:", paymentIntent.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        clientSecret: paymentIntent.client_secret,
        paymentLinkId: paymentLinkId || requestId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment intent creation error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
