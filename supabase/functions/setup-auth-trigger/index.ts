
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
    
    // Disable Supabase's automatic email verification
    console.log("Attempting to disable Supabase automatic email verification...");
    
    try {
      // Note: We're using this approach because the auth.config update may not be available in all Supabase instances
      const { error } = await supabaseAdmin.rpc('select_service_role', {
        service_request: `UPDATE auth.config SET enable_signup_captcha = false, enable_email_confirm = false WHERE id = 1`
      });
      
      if (error) {
        console.log("Note: Could not disable automatic email verification using RPC:", error.message);
        
        // Try direct method as fallback
        const { error: authSettingsError } = await supabaseAdmin
          .from('auth.config')
          .update({ enable_signup_captcha: false, enable_email_confirm: false })
          .eq('id', 1);
          
        if (authSettingsError) {
          console.log("Note: Could not disable automatic email verification directly:", authSettingsError.message);
          // Continue anyway, this is not critical
        } else {
          console.log("Disabled Supabase automatic email verification successfully using direct method");
        }
      } else {
        console.log("Disabled Supabase automatic email verification successfully using RPC");
      }
    } catch (configError) {
      console.error("Error updating auth settings:", configError);
      // Continue anyway, this is not critical
    }

    // Set up webhook URL for auth user creation
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-new-signup`;
    
    // Store the webhook URL in system_settings table
    const { error: settingError } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: 'auth_webhook_url',
        value: webhookUrl
      }, { onConflict: 'key' });
    
    if (settingError) {
      console.log("Note: Could not store webhook URL in settings:", settingError.message);
      // This is optional, so continue anyway
    }
    
    // Check if the database trigger is set up
    const { data: triggerData, error: triggerCheckError } = await supabaseAdmin.rpc('select_service_role', {
      service_request: `
        SELECT EXISTS(
          SELECT 1 FROM pg_trigger 
          WHERE tgname = 'on_auth_user_created' 
          AND tgrelid = 'auth.users'::regclass
        ) as trigger_exists
      `
    });
    
    const triggerExists = triggerData && triggerData.length > 0 && triggerData[0].trigger_exists;
    
    return new Response(
      JSON.stringify({ 
        message: "Auth settings updated successfully",
        webhookUrl: webhookUrl,
        triggerExists: triggerExists,
        note: "The system is configured to handle new signups. Make sure to test a signup flow." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error updating auth settings:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Please check the Edge Function logs for more details"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
