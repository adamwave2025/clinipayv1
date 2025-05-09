
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    // Get the publishable key from environment variables
    const publishableKey = Deno.env.get("PUBLISHABLE_KEY");
    
    if (!publishableKey) {
      console.error("Missing PUBLISHABLE_KEY in environment variables");
      throw new Error("Stripe publishable key is not configured");
    }
    
    console.log("Successfully retrieved publishable key");
    
    // Return the publishable key to the client
    return new Response(
      JSON.stringify({
        publishableKey
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      }
    );
  }
});
