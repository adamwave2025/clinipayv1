
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
    // Get request data
    let userData;
    
    try {
      // First, try to parse it as a direct webhook payload from database trigger
      const requestData = await req.json();
      console.log("Raw request data:", JSON.stringify(requestData));
      
      // Check if this is a database trigger webhook or direct API call
      if (requestData.type === 'INSERT' && requestData.table === 'users' && requestData.record) {
        // This is from our database trigger
        userData = {
          id: requestData.record.id,
          email: requestData.record.email,
          raw_user_meta_data: requestData.record.raw_user_meta_data,
          type: 'webhook_trigger'
        };
        console.log("Parsed webhook trigger data:", JSON.stringify(userData));
      } else {
        // This is a direct API call
        userData = requestData;
        console.log("Parsed direct API data:", JSON.stringify(userData));
      }
    } catch (parseError) {
      console.error("Error parsing request data:", parseError);
      throw new Error("Invalid request data format");
    }
    
    // Validate required data
    if (!userData?.id || !userData?.email) {
      console.log("Missing required user data, received:", JSON.stringify(userData));
      return new Response(
        JSON.stringify({ error: "Missing required user data (id and email)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Processing user signup:", userData.email, "User ID:", userData.id);
    
    // Create a Supabase client with the service role key for admin access
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

    // Extract clinic name from user metadata if available
    let clinicName = "New Clinic";
    if (userData.raw_user_meta_data?.clinic_name) {
      clinicName = userData.raw_user_meta_data.clinic_name;
    } else if (userData.clinic_name) {
      clinicName = userData.clinic_name;
    }

    // 1. Create clinic record if it doesn't exist
    console.log("Creating/updating clinic record for user:", userData.id);
    const { data: clinicData, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .upsert({
        id: userData.id, // Use the user ID as the clinic ID
        clinic_name: clinicName,
        email: userData.email,
        created_at: new Date().toISOString()
      })
      .select();

    if (clinicError) {
      console.error("Error creating clinic record:", clinicError);
    } else {
      console.log("Successfully created clinic record:", clinicData);
    }

    // 2. Assign the 'clinic' role to the new user
    console.log("Assigning 'clinic' role to user:", userData.id);
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userData.id,
        email: userData.email,
        role: "clinic",
        clinic_id: userData.id, // Link user to their clinic
      });

    if (roleError) {
      console.error("Error assigning role to user:", roleError);
    } else {
      console.log("Successfully assigned 'clinic' role to user");
    }

    // 3. Generate email verification token
    console.log("Generating verification token for:", userData.email);
    const { data: token, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: userData.email,
      options: {
        redirectTo: 'https://clinipay.co.uk/auth/callback'
      }
    });

    if (tokenError) {
      console.error("Error generating verification token:", tokenError);
      throw tokenError;
    }

    // Ensure we got a valid token response
    if (!token?.properties?.action_link) {
      console.error("Error: No verification URL in the response:", JSON.stringify(token));
      throw new Error("No verification URL returned from Supabase");
    }

    console.log("Generated verification link successfully");

    // Extract the verification URL from the response
    const verificationUrl = token.properties.action_link;
    
    // 3. Send the verification data to the GHL webhook
    const webhookUrl = Deno.env.get("NEW_SIGN_UP");
    if (!webhookUrl) {
      console.error("NEW_SIGN_UP webhook URL is not configured");
      throw new Error("NEW_SIGN_UP webhook URL is not configured");
    }

    console.log("Sending data to GHL webhook:", webhookUrl);

    const webhookPayload = {
      email: userData.email,
      verificationUrl: verificationUrl,
      userId: userData.id,
      clinicName: clinicName,
      timestamp: new Date().toISOString()
    };

    console.log("Webhook payload:", JSON.stringify(webhookPayload));

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`Error sending to webhook (${webhookResponse.status}):`, errorText);
      throw new Error(`Error sending to webhook: ${webhookResponse.status} ${errorText}`);
    }

    console.log("Successfully sent verification data to webhook with status:", webhookResponse.status);
    
    // Try to read the response body
    let responseBody;
    try {
      responseBody = await webhookResponse.text();
      console.log("Webhook response body:", responseBody);
    } catch (err) {
      console.log("Could not read webhook response body:", err.message);
    }

    return new Response(
      JSON.stringify({ 
        message: "Verification email handling complete", 
        success: true,
        email: userData.email,
        verificationUrl: verificationUrl,
        userId: userData.id,
        clinicName: clinicName
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error handling signup:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
