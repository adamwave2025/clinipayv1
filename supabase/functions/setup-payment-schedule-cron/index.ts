
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// This function will set up a cron job to process payment schedules every minute for testing
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

    console.log("🔧 Starting setup of payment processing cron job");

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
    const functionUrl = `https://${projectRef}.functions.supabase.co/process-payment-schedule`;
    console.log(`🔗 Function URL: ${functionUrl}`);

    // Check if cron job already exists
    const checkJobSql = `
      SELECT * FROM cron.job WHERE jobname = 'process_payment_schedule';
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
        SELECT cron.unschedule('process_payment_schedule');
      `;
      
      const { error: dropError } = await supabase.rpc('execute_sql', { 
        sql: dropJobSql 
      });
      
      if (dropError) {
        console.error("❌ Error removing existing cron job:", dropError);
        throw new Error(`Failed to remove existing cron job: ${dropError.message}`);
      }
    }

    // Create the cron job to call our function every minute (for testing)
    const createJobSql = `
      SELECT cron.schedule(
        'process_payment_schedule',
        '* * * * *',  -- Run every minute (for testing)
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

    console.log("✅ Payment processing cron job set up successfully to run every minute");

    // Run the payment processing immediately as a test
    console.log("🔄 Processing any pending payments immediately");
    try {
      const { data: processData, error: processError } = await supabase.functions.invoke('process-payment-schedule');
      
      if (processError) {
        console.error("⚠️ Error during immediate payment processing:", processError);
      } else {
        console.log("✅ Immediate payment processing result:", processData);
      }
    } catch (processErr) {
      console.error("⚠️ Exception during immediate payment processing:", processErr);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Payment processing cron job has been set up to run every minute (for testing)",
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
