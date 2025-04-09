
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a verification token
function generateVerificationToken(userId: string, email: string): string {
  const data = `${userId}:${email}:${Date.now()}`;
  return createHash('sha256').update(data).digest('hex');
}

// Generate a custom verification URL
function generateVerificationUrl(token: string, userId: string): string {
  const appUrl = "https://clinipay.co.uk";
  return `${appUrl}/verify-email?token=${token}&userId=${userId}`;
}

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
      } else if (requestData.type === 'verify_token') {
        // This is a token verification request
        return await handleVerifyToken(requestData, req);
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

    // 3. Generate a custom verification token
    const verificationToken = generateVerificationToken(userData.id, userData.email);
    console.log("Generated verification token for:", userData.email);
    
    // 4. Store the verification token in the database
    const { error: tokenError } = await supabaseAdmin
      .from("user_verification")
      .upsert({
        user_id: userData.id,
        email: userData.email,
        verification_token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours expiry
        verified: false
      });
      
    if (tokenError) {
      console.error("Error storing verification token:", tokenError);
      throw tokenError;
    }
    
    // 5. Generate the custom verification URL
    const verificationUrl = generateVerificationUrl(verificationToken, userData.id);
    console.log("Generated verification URL:", verificationUrl);
    
    // 6. Send the verification data to the GHL webhook
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

// Handler for token verification requests
async function handleVerifyToken(requestData: any, req: Request) {
  const { token, userId } = requestData;
  
  if (!token || !userId) {
    return new Response(
      JSON.stringify({ error: "Missing token or userId" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
  
  console.log("Processing verification request for token:", token, "and user:", userId);
  
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
  
  // Check if the token is valid
  const { data: verificationData, error: verificationError } = await supabaseAdmin
    .from("user_verification")
    .select("*")
    .eq("user_id", userId)
    .eq("verification_token", token)
    .gt("expires_at", new Date().toISOString())
    .single();
  
  if (verificationError || !verificationData) {
    console.error("Invalid or expired verification token:", verificationError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Invalid or expired verification token" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
  
  // Mark the user as verified
  const { error: updateError } = await supabaseAdmin
    .from("user_verification")
    .update({ verified: true })
    .eq("user_id", userId);
  
  if (updateError) {
    console.error("Error updating verification status:", updateError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to verify email" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
  
  // Set the user's email as confirmed in auth schema
  try {
    await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    console.log("User email confirmed in auth schema");
  } catch (authError) {
    console.error("Error confirming user email in auth schema:", authError);
    // Continue anyway, our custom verification is more important
  }
  
  console.log("User verified successfully:", userId);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Email verified successfully" 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
}
