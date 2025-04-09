
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

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
    // Get request data
    const { record, type } = await req.json();
    
    // Only process new user signups
    if (type !== 'INSERT' || !record?.id || !record?.email) {
      return new Response(
        JSON.stringify({ message: "Not a new user signup event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("Processing new user signup:", record.email);
    
    // Create a Supabase client with the service role key for admin access
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

    // 1. Assign the 'clinic' role to the new user
    // Fetch the user UUID from auth.users that matches the email
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: record.id,
        email: record.email,
        role: "clinic",
      });

    if (userError) {
      console.error("Error assigning role to user:", userError);
    } else {
      console.log("Successfully assigned 'clinic' role to user");
    }

    // 2. Generate email verification token
    const { data: token, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: record.email,
      options: {
        redirectTo: 'https://clinipay.co.uk/auth/callback'
      }
    });

    if (tokenError) {
      console.error("Error generating verification token:", tokenError);
      throw tokenError;
    }

    console.log("Generated verification link successfully");

    // Extract the verification URL from the response
    const verificationUrl = token.properties.action_link;
    
    // 3. Send the verification data to the GHL webhook
    const webhookUrl = Deno.env.get("NEW_SIGN_UP");
    if (!webhookUrl) {
      throw new Error("NEW_SIGN_UP webhook URL is not configured");
    }

    const webhookPayload = {
      email: record.email,
      verificationUrl: verificationUrl,
      userId: record.id,
      timestamp: new Date().toISOString()
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Error sending to webhook: ${webhookResponse.status} ${await webhookResponse.text()}`);
    }

    console.log("Successfully sent verification data to webhook");

    return new Response(
      JSON.stringify({ message: "Verification email handling complete" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error handling new signup:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
