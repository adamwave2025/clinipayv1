
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
    
    // Handle different types of requests
    if (requestData.type === 'verify_token') {
      // Verify a token
      return await handleVerifyToken(supabase, requestData, corsHeaders);
    } else if (requestData.type === 'resend') {
      // Resend verification email
      return await handleResendVerification(supabase, requestData, corsHeaders);
    } else {
      // Handle signup
      return await handleNewSignup(supabase, requestData, corsHeaders);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Handle new signup
async function handleNewSignup(supabase, requestData, corsHeaders) {
  try {
    const { id, email, clinic_name } = requestData;
    
    // Create all necessary records via direct table operations
    const { error: clinicError } = await supabase
      .from('clinics')
      .upsert({
        id,
        clinic_name,
        email,
        created_at: new Date().toISOString()
      });
      
    if (clinicError) throw clinicError;
    
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id,
        email,
        role: 'clinic',
        clinic_id: id,
        verified: false,
        created_at: new Date().toISOString()
      });
      
    if (userError) throw userError;
    
    // Create verification token
    const verificationToken = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1); // 24 hours
    
    // Insert verification record directly
    const { error: verificationError } = await supabase
      .from('user_verification')
      .insert({
        user_id: id,
        email: email,
        verification_token: verificationToken,
        expires_at: expiryDate.toISOString(),
        verified: false
      });
    
    if (verificationError) throw verificationError;
    
    // Generate verification URL
    const verificationUrl = `https://clinipay.co.uk/verify-email?token=${verificationToken}&userId=${id}`;
    
    // In a real scenario, send an email here
    console.log("Verification URL:", verificationUrl);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User records created successfully",
        verificationUrl
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
    
    // Find the verification record directly
    const { data: verificationRecords, error: findError } = await supabase
      .from('user_verification')
      .select('*')
      .eq('verification_token', token)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .eq('verified', false)
      .limit(1);
      
    if (findError) throw findError;
    
    if (!verificationRecords || verificationRecords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid verification token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Update the user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ verified: true })
      .eq('id', userId);
      
    if (updateError) throw updateError;
    
    // Update verification record
    const { error: verificationUpdateError } = await supabase
      .from('user_verification')
      .update({ verified: true })
      .eq('verification_token', token)
      .eq('user_id', userId);
      
    if (verificationUpdateError) throw verificationUpdateError;
    
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
    
    // Find user if id not provided
    let userId = id;
    if (!userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
      if (userError) throw userError;
      userId = userData.id;
    }
    
    // Create new verification token
    const verificationToken = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1); // 24 hours
    
    // Insert new verification record directly
    const { error: verificationError } = await supabase
      .from('user_verification')
      .insert({
        user_id: userId,
        email: email,
        verification_token: verificationToken,
        expires_at: expiryDate.toISOString(),
        verified: false
      });
    
    if (verificationError) throw verificationError;
    
    // Generate verification URL
    const verificationUrl = `https://clinipay.co.uk/verify-email?token=${verificationToken}&userId=${userId}`;
    
    // In a real scenario, send an email here
    console.log("Resent verification URL:", verificationUrl);
    
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
