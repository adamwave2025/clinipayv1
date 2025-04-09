
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get request body
    const requestData = await req.json();
    
    // Initialize Supabase client with service role for admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine what type of request we're handling
    const { type } = requestData;
    
    if (type === 'verify_token') {
      return await handleVerifyToken(supabase, requestData, corsHeaders);
    } else if (type === 'resend') {
      return await handleResendVerification(supabase, requestData, corsHeaders);
    } else if (type === 'check_verification') {
      return await handleCheckVerification(supabase, requestData, corsHeaders);
    } else {
      return await handleNewSignup(supabase, requestData, corsHeaders);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Handle new signup
async function handleNewSignup(supabase, requestData, corsHeaders) {
  try {
    const { id, email, clinic_name } = requestData;
    
    console.log(`Processing new signup: ${email} with ID ${id}`);
    
    // Generate a verification token
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      'generate_verification_token',
      { user_id: id }
    );
    
    if (tokenError) {
      console.error("Error generating verification token:", tokenError);
      throw tokenError;
    }
    
    // Get the token from result
    const verificationToken = tokenData;
    
    // Create clinic if it doesn't exist
    if (clinic_name) {
      const { error: clinicError } = await supabase
        .from('clinics')
        .upsert({
          id: id,
          clinic_name: clinic_name,
          email: email,
          created_at: new Date().toISOString()
        });
            
      if (clinicError) {
        console.error("Error creating clinic record:", clinicError);
      }
    }
    
    // Generate verification URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://clinipay.co.uk";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&userId=${id}`;
    
    // Forward the verification URL to the NEW_SIGN_UP webhook if configured
    const newSignUpWebhook = Deno.env.get("NEW_SIGN_UP");
    if (newSignUpWebhook) {
      try {
        console.log("Forwarding verification to webhook:", newSignUpWebhook);
        const webhookResponse = await fetch(newSignUpWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            verificationUrl: verificationUrl,
            userId: id,
            clinicName: clinic_name
          })
        });
        
        console.log("Webhook response status:", webhookResponse.status);
      } catch (webhookError) {
        console.error("Error sending to webhook:", webhookError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification setup successfully",
        verificationUrl,
        userId: id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handleNewSignup:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Handle token verification
async function handleVerifyToken(supabase, requestData, corsHeaders) {
  try {
    const { token, userId } = requestData;
    
    console.log(`Verifying token for user ${userId}`);
    
    // Find the user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('verification_token, token_expires_at')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error("Error querying user:", userError);
      throw userError;
    }
    
    // Verify token and expiry
    if (!userData || 
        userData.verification_token !== token || 
        !userData.token_expires_at || 
        new Date(userData.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid or expired verification token" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Update the user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        verified: true,
        verification_token: null,
        token_expires_at: null
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error updating user verification status:", updateError);
      throw updateError;
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handleVerifyToken:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Handle resend verification
async function handleResendVerification(supabase, requestData, corsHeaders) {
  try {
    const { email, id } = requestData;
    
    console.log(`Resending verification for ${email}`);
    
    // Find user if id not provided
    let userId = id;
    if (!userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (userError || !userData) {
        console.error("Error finding user:", userError);
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
      userId = userData.id;
    }
    
    // Generate a new verification token
    const { data: token, error: tokenError } = await supabase.rpc(
      'generate_verification_token',
      { user_id: userId }
    );
    
    if (tokenError) {
      console.error("Error generating verification token:", tokenError);
      throw tokenError;
    }
    
    // Generate verification URL with token
    const baseUrl = Deno.env.get("SITE_URL") || "https://clinipay.co.uk";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}&userId=${userId}`;
    
    // Forward the verification URL to the NEW_SIGN_UP webhook if configured
    const newSignUpWebhook = Deno.env.get("NEW_SIGN_UP");
    if (newSignUpWebhook) {
      try {
        console.log("Forwarding verification to webhook:", newSignUpWebhook);
        await fetch(newSignUpWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            verificationUrl: verificationUrl,
            userId: userId,
            resend: true
          })
        });
      } catch (webhookError) {
        console.error("Error sending to webhook:", webhookError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email resent successfully",
        verificationUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handleResendVerification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Function to check verification status
async function handleCheckVerification(supabase, requestData, corsHeaders) {
  try {
    const { userId } = requestData;
    
    // Find the user verification status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('verified')
      .eq('id', userId)
      .maybeSingle();
      
    if (userError) {
      console.error("Error checking user verification status:", userError);
      throw userError;
    }
    
    if (!userData) {
      return new Response(
        JSON.stringify({ success: false, verified: false, error: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: userData.verified 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handleCheckVerification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}
