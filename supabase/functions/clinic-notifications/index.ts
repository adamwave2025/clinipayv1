
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleNotification } from "./handlers.ts";
import { corsHeaders } from "./config.ts";

serve(async (req) => {
  console.log("Clinic notification function called at:", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await handleNotification(req);
  } catch (error) {
    console.error("Unhandled error in clinic notification function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
