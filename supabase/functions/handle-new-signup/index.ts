
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
    console.log("Received request:", JSON.stringify(requestData, null, 2));
    
    // Initialize Supabase client with service role for admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine what type of request we're handling
    const { type } = requestData;
    console.log("Request type:", type);
    
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
    console.error("Error stack:", error.stack);
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
    
    console.log(`Processing new signup: ${email} with ID ${id}, clinic name: ${clinic_name}`);
    
    // Generate a verification token
    console.log("Generating verification token...");
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
    console.log("Verification token generated successfully");
    
    // Generate verification URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://clinipay.co.uk";
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&userId=${id}`;
    console.log("Verification URL generated:", verificationUrl);
    
    // Check if a clinic was created via database trigger
    console.log("Checking if clinic was created via trigger...");
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('id, email_notifications, sms_notifications, clinic_name')
      .eq('email', email)
      .maybeSingle();
      
    if (clinicError) {
      console.error("Error checking clinic:", clinicError);
    }

    // Determine the clinic name to use, prioritizing database value over request data
    let clinicNameToUse = "";
    
    // First check if we have clinic data from the database
    if (clinicData && clinicData.clinic_name) {
      console.log(`Found clinic with ID ${clinicData.id} for email ${email}`);
      console.log(`Clinic notification settings: email=${clinicData.email_notifications}, sms=${clinicData.sms_notifications}`);
      clinicNameToUse = clinicData.clinic_name;
    } 
    // Then check if clinic_name was provided in the request
    else if (clinic_name) {
      // Handle different formats of clinic_name in the request
      if (typeof clinic_name === 'object' && clinic_name?.name) {
        clinicNameToUse = clinic_name.name;
      } else if (typeof clinic_name === 'string') {
        clinicNameToUse = clinic_name;
      }
      console.log(`No clinic found in database, using provided clinic name: ${clinicNameToUse}`);
    }
    
    // If we still don't have a name, use a default
    if (!clinicNameToUse) {
      clinicNameToUse = "your clinic";
      console.log(`No clinic name available, using default: ${clinicNameToUse}`);
    }
    
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
            clinicName: clinicNameToUse
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
    console.error("Error stack:", error.stack);
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
    
    // Get clinic name for this user by joining users and clinics tables
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, clinic_id, clinics:clinic_id(clinic_name)')
      .eq('id', userId)
      .maybeSingle();
      
    // Determine the clinic name to use  
    let clinicName = "";
    if (!userError && userData && userData.clinics && userData.clinics.clinic_name) {
      clinicName = userData.clinics.clinic_name;
      console.log(`Found clinic name: ${clinicName} for user ${userId}`);
    } else {
      // Look up clinic directly if the join didn't work
      if (userData && userData.clinic_id) {
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('clinic_name')
          .eq('id', userData.clinic_id)
          .maybeSingle();
          
        if (!clinicError && clinicData && clinicData.clinic_name) {
          clinicName = clinicData.clinic_name;
          console.log(`Found clinic name: ${clinicName} via direct query`);
        }
      }
      
      // If we still don't have a name, use a default
      if (!clinicName) {
        clinicName = "your clinic";
        console.log(`No clinic found for userId ${userId}, using default clinic name`);
      }
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
            clinicName: clinicName,
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
