
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // First, find the user by email and join with clinics table to get clinic name
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, clinic_id, clinics:clinic_id(clinic_name)')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error("Error finding user:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Error finding user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If an account with that email exists, a password reset link has been sent" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract clinic name from the joined data, with fallback
    const clinicName = userData.clinics?.clinic_name || "Your Clinic";

    // Generate a random token 
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Save token to user record
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        verification_token: token,
        token_expires_at: expiresAt.toISOString()
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error("Error saving reset token:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Error generating reset token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the redirect URL based on environment
    const isProduction = Deno.env.get("SUPABASE_URL")?.includes("jbtxxlkhiubuzanegtzn");
    const baseUrl = isProduction 
      ? "https://clinipay.co.uk" 
      : "http://localhost:3000";

    // Create the password reset link with our custom token
    const resetLink = `${baseUrl}/reset-password?token=${token}&userId=${userData.id}`;

    console.log("Generated reset link:", resetLink);

    // Send to GHL webhook
    const webhookUrl = Deno.env.get("RESET_PASSWORD");
    if (!webhookUrl) {
      console.error("GHL webhook URL not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Webhook URL not configured" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare the data for GHL webhook, now including the clinic name
    const webhookData = {
      email,
      resetLink,
      clinicName,
      timestamp: new Date().toISOString(),
      source: "CliniPay Password Reset"
    };

    // Send to GHL webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    });

    if (!webhookResponse.ok) {
      console.error("Error sending to webhook:", await webhookResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send reset link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset link sent successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
