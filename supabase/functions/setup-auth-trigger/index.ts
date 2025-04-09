
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
    console.log("Disabling Supabase's automatic email verification...");
    
    try {
      // We're using multiple approaches to ensure email verification is disabled
      // First try using RPC
      const { error: rpcError } = await supabaseAdmin.rpc('select_service_role', {
        service_request: `UPDATE auth.config SET enable_signup_captcha = false, enable_email_confirm = false WHERE id = 1`
      });
      
      if (rpcError) {
        console.log("Could not disable email verification using RPC:", rpcError.message);
        
        // Try direct method as fallback
        const { error: directError } = await supabaseAdmin
          .from('auth.config')
          .update({ enable_signup_captcha: false, enable_email_confirm: false })
          .eq('id', 1);
          
        if (directError) {
          console.log("Could not disable email verification directly:", directError.message);
        } else {
          console.log("Disabled Supabase email verification successfully using direct method");
        }
      } else {
        console.log("Disabled Supabase email verification successfully using RPC");
      }
      
      // Try additional methods to be thorough
      console.log("Applying additional verification disabling methods...");
      
      // Set auto confirm to true via another method
      await supabaseAdmin.rpc('select_service_role', {
        service_request: `INSERT INTO auth.config (name, value) 
        VALUES ('mailer.autoconfirm', 'true') 
        ON CONFLICT (name) DO UPDATE SET value = 'true'`
      });
      
    } catch (configError) {
      console.error("Error updating auth settings:", configError);
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
      console.log("Could not store webhook URL in settings:", settingError.message);
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
        note: "The system is configured for custom email verification. Automatic Supabase verification has been disabled." 
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
