
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePasswordRequest {
  userId: string;
  token: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, token, password } = await req.json() as UpdatePasswordRequest;

    if (!userId || !token || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client with service role key
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

    // First verify the token is valid
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('verification_token, token_expires_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('Error verifying token:', userError);
      return new Response(
        JSON.stringify({ success: false, error: "Error verifying reset token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!userData) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (userData.verification_token !== token) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid reset token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!userData.token_expires_at || new Date(userData.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "This reset link has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's password using the admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear the verification token from our users table
    const { error: clearTokenError } = await supabaseAdmin
      .from('users')
      .update({ 
        verification_token: null,
        token_expires_at: null
      })
      .eq('id', userId);
    
    if (clearTokenError) {
      console.error('Error clearing reset token:', clearTokenError);
      // Non-critical error, continue with success flow
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error('Unexpected error updating password:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
