
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

    // Determine the redirect URL based on environment
    // In production, use clinipay.co.uk, in development use localhost
    const isProduction = Deno.env.get("SUPABASE_URL")?.includes("jbtxxlkhiubuzanegtzn");
    const redirectUrl = isProduction
      ? "https://clinipay.co.uk/reset-password"
      : "http://localhost:3000/reset-password";

    console.log(`Using redirect URL: ${redirectUrl} for environment: ${isProduction ? "production" : "development"}`);

    // Generate password reset token using Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (error) {
      console.error("Error generating reset link:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the reset token link
    const resetLink = data.properties.action_link;

    // Log for debugging
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

    // Prepare the data for GHL webhook
    const webhookData = {
      email,
      resetLink,
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
