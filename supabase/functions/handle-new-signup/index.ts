
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
    } else if (requestData.type === 'check_verification') {
      // Check verification status
      return await handleCheckVerification(supabase, requestData, corsHeaders);
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
    
    // First check if table exists
    const { error: tableCheckError } = await supabase.rpc(
      'select_service_role',
      {
        service_request: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'user_verification'
          );
        `
      }
    );
    
    if (tableCheckError) {
      console.log("Could not check if user_verification table exists:", tableCheckError.message);
      
      // Create the table if it might not exist
      try {
        const { error: createTableError } = await supabase.rpc(
          'select_service_role',
          {
            service_request: `
              CREATE TABLE IF NOT EXISTS public.user_verification (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                verification_token TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                verified BOOLEAN DEFAULT false
              );
              CREATE INDEX IF NOT EXISTS idx_user_verification_token ON public.user_verification(verification_token);
              CREATE INDEX IF NOT EXISTS idx_user_verification_user_id ON public.user_verification(user_id);
              ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
            `
          }
        );
        
        if (createTableError) {
          console.error("Error creating user_verification table:", createTableError);
        }
      } catch (err) {
        console.error("Failed to create user_verification table:", err);
      }
    }
    
    // Insert verification record using direct SQL
    const { error: insertError } = await supabase.rpc(
      'select_service_role',
      {
        service_request: `
          INSERT INTO public.user_verification (
            user_id,
            email,
            verification_token,
            expires_at,
            verified
          ) VALUES (
            '${id}'::uuid,
            '${email}',
            '${verificationToken}',
            '${expiryDate.toISOString()}'::timestamptz,
            FALSE
          );
        `
      }
    );
    
    if (insertError) {
      console.error("Error inserting verification record:", insertError);
      
      // Fallback: try direct table operation if RPC fails
      const { error: directInsertError } = await supabase
        .from('user_verification')
        .insert({
          user_id: id,
          email: email,
          verification_token: verificationToken,
          expires_at: expiryDate.toISOString(),
          verified: false
        });
        
      if (directInsertError) {
        throw directInsertError;
      }
    }
    
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
    
    // Find the verification record using direct SQL
    const { data: verificationResult, error: queryError } = await supabase.rpc(
      'select_service_role',
      {
        service_request: `
          SELECT *
          FROM public.user_verification
          WHERE verification_token = '${token}'
          AND user_id = '${userId}'::uuid
          AND expires_at > NOW()
          AND verified = FALSE
          LIMIT 1;
        `
      }
    );
    
    let verificationRecords;
    
    if (queryError) {
      console.error("Error querying verification with RPC:", queryError);
      
      // Fallback: try direct table operation
      const { data: directData, error: directError } = await supabase
        .from('user_verification')
        .select('*')
        .eq('verification_token', token)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .eq('verified', false)
        .limit(1);
        
      if (directError) throw directError;
      
      verificationRecords = directData;
    } else {
      verificationRecords = verificationResult || [];
    }
    
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
    const { error: updateVerfError } = await supabase.rpc(
      'select_service_role',
      {
        service_request: `
          UPDATE public.user_verification
          SET verified = TRUE
          WHERE verification_token = '${token}'
          AND user_id = '${userId}'::uuid;
        `
      }
    );
    
    if (updateVerfError) {
      console.error("Error updating verification with RPC:", updateVerfError);
      
      // Fallback: try direct table operation
      const { error: directError } = await supabase
        .from('user_verification')
        .update({ verified: true })
        .eq('verification_token', token)
        .eq('user_id', userId);
        
      if (directError) throw directError;
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
    
    // Insert new verification record using direct SQL
    const { error: insertError } = await supabase.rpc(
      'select_service_role',
      {
        service_request: `
          INSERT INTO public.user_verification (
            user_id,
            email,
            verification_token,
            expires_at,
            verified
          ) VALUES (
            '${userId}'::uuid,
            '${email}',
            '${verificationToken}',
            '${expiryDate.toISOString()}'::timestamptz,
            FALSE
          );
        `
      }
    );
    
    if (insertError) {
      console.error("Error inserting verification record with RPC:", insertError);
      
      // Fallback: try direct table operation
      const { error: directError } = await supabase
        .from('user_verification')
        .insert({
          user_id: userId,
          email: email,
          verification_token: verificationToken,
          expires_at: expiryDate.toISOString(),
          verified: false
        });
        
      if (directError) throw directError;
    }
    
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

// Function to check verification status
async function handleCheckVerification(supabase, requestData, corsHeaders) {
  try {
    const { userId, token } = requestData;
    
    // Find the verification record using direct SQL
    const { data: verificationResult, error: queryError } = await supabase.rpc(
      'select_service_role',
      {
        service_request: `
          SELECT *
          FROM public.user_verification
          WHERE verification_token = '${token}'
          AND user_id = '${userId}'::uuid
          LIMIT 1;
        `
      }
    );
    
    let verificationRecords;
    
    if (queryError) {
      console.error("Error querying verification with RPC:", queryError);
      
      // Fallback: try direct table operation
      const { data: directData, error: directError } = await supabase
        .from('user_verification')
        .select('*')
        .eq('verification_token', token)
        .eq('user_id', userId)
        .limit(1);
        
      if (directError) throw directError;
      
      verificationRecords = directData;
    } else {
      verificationRecords = verificationResult || [];
    }
    
    if (!verificationRecords || verificationRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          error: "Verification record not found" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const verificationRecord = verificationRecords[0];
    const isExpired = new Date(verificationRecord.expires_at) < new Date();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: verificationRecord.verified, 
        isExpired: isExpired,
        record: verificationRecord
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
