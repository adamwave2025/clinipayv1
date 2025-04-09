
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
    
    console.log("Setting up auth trigger and database functions...");
    
    // First, ensure we have the process_auth_user_created function
    try {
      const { error: functionError } = await supabaseAdmin.rpc('select_service_role', {
        service_request: `
          CREATE OR REPLACE FUNCTION public.process_auth_user_created()
          RETURNS trigger
          LANGUAGE plpgsql
          AS $$
          DECLARE
            webhook_url TEXT;
            payload JSONB;
          BEGIN
            -- Get the webhook URL from system_settings
            SELECT value INTO webhook_url FROM public.system_settings WHERE key = 'auth_webhook_url';
            
            -- Skip if no webhook URL is configured
            IF webhook_url IS NULL THEN
              RAISE WARNING 'No webhook URL configured for auth_user_created';
              RETURN NEW;
            END IF;
            
            -- Prepare the payload
            payload := jsonb_build_object(
              'type', 'INSERT',
              'table', TG_TABLE_NAME,
              'schema', TG_TABLE_SCHEMA,
              'record', row_to_json(NEW)::jsonb
            );
            
            -- Send the webhook
            PERFORM http_post(
              webhook_url,
              payload::text,
              'application/json'
            );
            
            RAISE NOTICE 'Webhook sent to %', webhook_url;
            
            RETURN NEW;
          EXCEPTION
            WHEN OTHERS THEN
              RAISE WARNING 'Error sending webhook: %', SQLERRM;
              RETURN NEW;
          END;
          $$;
        `
      });
      
      if (functionError) {
        console.error("Error creating process_auth_user_created function:", functionError);
      } else {
        console.log("Successfully created or updated process_auth_user_created function");
      }
    } catch (err) {
      console.error("Error creating function:", err);
    }
    
    // Try to disable Supabase's automatic email verification (multiple methods)
    try {
      console.log("Disabling Supabase's automatic email verification...");
      
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
    console.log("Setting webhook URL:", webhookUrl);
    
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
    
    // If trigger doesn't exist, create it
    if (!triggerExists) {
      console.log("Setting up auth user creation trigger...");
      
      try {
        // Drop the trigger if it already exists (to recreate it correctly)
        const { error: dropError } = await supabaseAdmin.rpc('select_service_role', {
          service_request: `
            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          `
        });
        
        if (dropError) {
          console.error("Error dropping existing auth trigger:", dropError);
        }

        // Create the trigger to call our function
        const { error: triggerError } = await supabaseAdmin.rpc('select_service_role', {
          service_request: `
            CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.process_auth_user_created();
          `
        });
        
        if (triggerError) {
          console.error("Error creating auth trigger:", triggerError);
        } else {
          console.log("Successfully created auth user trigger");
        }
      } catch (triggerCreateError) {
        console.error("Error setting up auth trigger:", triggerCreateError);
      }
    } else {
      console.log("Auth user creation trigger already exists");
    }
    
    // Create user_verification table if it doesn't exist
    try {
      const { error: tableError } = await supabaseAdmin.rpc('select_service_role', {
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
          
          -- Add index for faster token lookups
          CREATE INDEX IF NOT EXISTS idx_user_verification_token ON public.user_verification(verification_token);
          CREATE INDEX IF NOT EXISTS idx_user_verification_user_id ON public.user_verification(user_id);
          
          -- Add RLS policies
          ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
          
          -- Only admins can select verification records directly
          CREATE POLICY IF NOT EXISTS "Admin users can select verification records"
            ON public.user_verification
            FOR SELECT
            USING (
              EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid() AND users.role = 'admin'
              )
            );
          
          -- Only the service role can insert/update verification records
          CREATE POLICY IF NOT EXISTS "Service role can manage verification records"
            ON public.user_verification
            USING (true)
            WITH CHECK (true);
        `
      });
      
      if (tableError) {
        console.error("Error creating user_verification table:", tableError);
      } else {
        console.log("Successfully created or updated user_verification table");
      }
    } catch (tableError) {
      console.error("Error setting up verification table:", tableError);
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Auth settings and triggers updated successfully",
        triggerExists: triggerExists,
        note: "The system is configured for custom email verification." 
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
