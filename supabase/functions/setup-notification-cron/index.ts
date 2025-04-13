
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// This function will set up a cron job to process notifications every minute
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔧 Starting setup of notification processing cron job");

    // Check if execute_sql function exists before trying to use it
    try {
      // Test the execute_sql function
      const testResult = await supabase.rpc('execute_sql', { 
        sql: 'SELECT NOW()' 
      });
      
      if (testResult.error) {
        throw new Error(`Execute SQL function test failed: ${testResult.error.message}`);
      }
      
      console.log("✅ Execute SQL function test successful");
    } catch (testError) {
      console.error("❌ Execute SQL function test failed:", testError);
      throw new Error(`The execute_sql function may not be available: ${testError.message}`);
    }

    // Enable the pg_cron and pg_net extensions if they're not already enabled
    const { error: extensionError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        CREATE EXTENSION IF NOT EXISTS pg_net;
      `
    });

    if (extensionError) {
      console.error("❌ Error enabling extensions:", extensionError);
      
      // Try an alternative method if the rpc method fails
      console.log("🔄 Trying alternative method to enable extensions...");
      const { error: directQueryError } = await supabase
        .from('_postgrest_temp')
        .select('*')
        .limit(1)
        .then(() => supabase.from('_postgrest_temp').select(`
          CREATE EXTENSION IF NOT EXISTS pg_cron;
          CREATE EXTENSION IF NOT EXISTS pg_net;
        `));
        
      if (directQueryError) {
        console.error("❌ Direct query error:", directQueryError);
        throw new Error(`Failed to enable extensions: ${directQueryError.message}`);
      }
    }

    // Get the Supabase anon key to use in the cron job
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) {
      throw new Error("Missing Supabase anon key");
    }

    // Get the project reference from the URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    if (!projectRef) {
      throw new Error("Could not extract project reference from Supabase URL");
    }

    console.log(`📊 Project reference: ${projectRef}`);

    // Form the function URL
    const functionUrl = `https://${projectRef}.functions.supabase.co/process-notification-queue`;
    console.log(`🔗 Function URL: ${functionUrl}`);

    // Check if cron job already exists
    const checkJobSql = `
      SELECT * FROM cron.job WHERE jobname = 'process_notifications';
    `;

    const { data: existingJobs, error: checkError } = await supabase.rpc('execute_sql', { 
      sql: checkJobSql 
    });

    if (checkError) {
      console.error("❌ Error checking for existing cron job:", checkError);
      throw new Error(`Failed to check for existing cron job: ${checkError.message}`);
    }

    // If job exists, remove it first to avoid duplicates
    if (existingJobs && existingJobs.length > 0) {
      console.log("🗑️ Removing existing cron job");
      
      const dropJobSql = `
        SELECT cron.unschedule('process_notifications');
      `;
      
      const { error: dropError } = await supabase.rpc('execute_sql', { 
        sql: dropJobSql 
      });
      
      if (dropError) {
        console.error("❌ Error removing existing cron job:", dropError);
        throw new Error(`Failed to remove existing cron job: ${dropError.message}`);
      }
    }

    // Create the cron job to call our function every minute
    const createJobSql = `
      SELECT cron.schedule(
        'process_notifications',
        '* * * * *',  -- Run every minute
        $$
        SELECT
          net.http_post(
            url:='${functionUrl}',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${anonKey}"}'::jsonb,
            body:='{}'::jsonb
          ) AS request_id;
        $$
      );
    `;

    const { error: scheduleError } = await supabase.rpc('execute_sql', { 
      sql: createJobSql 
    });

    if (scheduleError) {
      console.error("❌ Error creating cron job:", scheduleError);
      throw new Error(`Failed to create cron job: ${scheduleError.message}`);
    }

    console.log("✅ Notification processing cron job set up successfully");

    // Run the notification processing immediately as a test
    console.log("🔄 Processing any pending notifications immediately");
    try {
      const { data: processData, error: processError } = await supabase.functions.invoke('process-notification-queue');
      
      if (processError) {
        console.error("⚠️ Error during immediate notification processing:", processError);
        // Don't throw, this is just a test
      } else {
        console.log("✅ Immediate notification processing result:", processData);
      }
    } catch (processErr) {
      console.error("⚠️ Exception during immediate notification processing:", processErr);
      // Don't throw, this is just a test
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Notification processing cron job has been set up to run every minute",
      function_url: functionUrl
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("❌ Error setting up cron job:", err);
    
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "An unexpected error occurred"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
