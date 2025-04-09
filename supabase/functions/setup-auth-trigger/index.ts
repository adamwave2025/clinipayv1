
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
    // Create Supabase client with admin privileges
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

    // First, create the webhook function if it doesn't exist
    const { error: functionError } = await supabaseAdmin.rpc('create_webhook_function', {});
    
    if (functionError) {
      console.error("Error creating webhook function:", functionError);
      
      // Try to create the function directly with SQL
      const { error: sqlError } = await supabaseAdmin.rpc('create_pg_webhook_function');
      
      if (sqlError) {
        console.error("Error creating webhook function with SQL:", sqlError);
        throw new Error("Failed to create webhook function: " + sqlError.message);
      }
    }

    console.log("Webhook function created successfully");

    // Now create the trigger
    const { error } = await supabaseAdmin.rpc('create_pg_webhook', {
      webhook_name: 'auth_user_created',
      url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-new-signup`,
      events: ['INSERT'],
      table: 'users',
      schema: 'auth'
    });

    if (error) {
      console.error("Error creating webhook trigger:", error);
      throw error;
    }

    // Also, let's disable Supabase's automatic email verification
    const { error: authSettingsError } = await supabaseAdmin
      .from('auth.config')
      .update({ enable_signup_captcha: false, enable_email_confirm: false })
      .eq('id', 1);

    if (authSettingsError) {
      console.log("Note: Could not disable automatic email verification:", authSettingsError.message);
      // Continue anyway, this is not critical
    } else {
      console.log("Disabled Supabase automatic email verification");
    }

    return new Response(
      JSON.stringify({ 
        message: "Webhook trigger setup successfully",
        note: "To complete setup, remember to check Edge Function logs for confirmation" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error setting up trigger:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Please check the Edge Function logs for more details"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
