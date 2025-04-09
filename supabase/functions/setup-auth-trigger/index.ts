
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
    console.log("Setup auth trigger function called");
    
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

    // Verify the auth trigger is working
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      sql: `SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
      )`
    });
    
    if (error) {
      console.error("Error checking trigger:", error);
      throw new Error("Failed to verify auth trigger: " + error.message);
    }

    const triggerExists = data && data[0] && data[0].exists === true;
    console.log("Auth trigger exists:", triggerExists);
    
    if (!triggerExists) {
      // If trigger doesn't exist, recreate it
      const { error: createError } = await supabaseAdmin.rpc('execute_sql', {
        sql: `
        -- Create function to handle new users
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER SET search_path = public
        AS $$
        BEGIN
          -- Insert into users table
          INSERT INTO public.users (id, email, role, verified)
          VALUES (NEW.id, NEW.email, 'clinic', false)
          ON CONFLICT (id) DO NOTHING;
          
          RETURN NEW;
        END;
        $$;

        -- Create or replace the trigger
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        `
      });
      
      if (createError) {
        console.error("Error creating auth trigger:", createError);
        throw new Error("Failed to create auth trigger: " + createError.message);
      }
      
      console.log("Auth trigger created successfully");
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
    } else {
      console.log("Successfully stored webhook URL in system_settings:", webhookUrl);
    }
    
    // Return success
    return new Response(
      JSON.stringify({ 
        message: "Auth settings updated successfully",
        webhookUrl: webhookUrl
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
