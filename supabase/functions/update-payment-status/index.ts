
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Get Supabase connection details from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    // Initialize Supabase client with the service role key for admin privileges
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { attemptId, status } = await req.json();
    
    if (!attemptId || !status) {
      throw new Error("Missing required parameters");
    }
    
    console.log(`Updating payment attempt ${attemptId} to status: ${status}`);
    
    // Direct SQL query to update the payment attempt status
    const { error } = await supabase.rpc('update_payment_attempt_status', {
      attempt_id: attemptId,
      new_status: status
    });
    
    if (error) {
      console.error("Error updating payment attempt:", error);
      throw error;
    }
    
    console.log(`Successfully updated payment attempt ${attemptId} to ${status}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Payment attempt ${attemptId} updated to ${status}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
