
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a verification token
function generateVerificationToken(userId: string, email: string): string {
  const data = `${userId}:${email}:${Date.now()}:${Math.random()}`;
  return createHash('sha256').update(data).digest('hex');
}

// Generate a custom verification URL using clinipay.co.uk domain
function generateVerificationUrl(token: string, userId: string): string {
  return `https://clinipay.co.uk/verify-email?token=${token}&userId=${userId}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("handle-new-signup function called with method:", req.method);
    
    // Get request data
    let userData;
    
    try {
      // Parse the request data
      const requestData = await req.json();
      console.log("Raw request data:", JSON.stringify(requestData));
      
      // Check request type
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
      } else if (requestData.type === 'resend') {
        // This is a resend verification request
        return await handleResendVerification(requestData, req);
      } else {
        // This is a direct API call
        userData = requestData;
        console.log("Parsed direct API data:", JSON.stringify(userData));
      }
    } catch (parseError) {
      console.error("Error parsing request data:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request data format", details: parseError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
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
      throw clinicError;
    } else {
      console.log("Successfully created clinic record:", clinicData);
    }

    // 2. Assign the 'clinic' role to the new user and ensure verified is set to false
    console.log("Assigning 'clinic' role to user:", userData.id);
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userData.id,
        email: userData.email,
        role: "clinic",
        clinic_id: userData.id, // Link user to their clinic
        verified: false
      });

    if (roleError) {
      console.error("Error assigning role to user:", roleError);
      throw roleError;
    } else {
      console.log("Successfully assigned 'clinic' role to user");
    }

    // 3. Generate a custom verification token
    const verificationToken = generateVerificationToken(userData.id, userData.email);
    console.log("Generated verification token for:", userData.email);
    
    // 4. Store the verification token in user_verification table
    const expiryTime = new Date();
    expiryTime.setDate(expiryTime.getDate() + 1); // 24 hours from now
    
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from("user_verification")
      .upsert({
        user_id: userData.id,
        email: userData.email,
        verification_token: verificationToken,
        expires_at: expiryTime.toISOString(),
        verified: false
      });
      
    if (verificationError) {
      console.error("Error storing verification token:", verificationError);
      throw verificationError;
    } else {
      console.log("Successfully stored verification token");
    }
    
    // 5. Generate the custom verification URL using clinipay.co.uk domain
    const verificationUrl = generateVerificationUrl(verificationToken, userData.id);
    console.log("Generated verification URL:", verificationUrl);
    
    // 6. Send the verification data to the GHL webhook
    const webhookUrl = Deno.env.get("NEW_SIGN_UP");
    if (!webhookUrl) {
      console.error("NEW_SIGN_UP webhook URL is not configured");
      
      // Return success with the verification URL even if webhook fails
      // This allows the frontend to handle verification for testing
      return new Response(
        JSON.stringify({ 
          message: "User created successfully but webhook failed (NEW_SIGN_UP not configured)", 
          success: true,
          email: userData.email,
          verificationUrl: verificationUrl,
          userId: userData.id,
          clinicName: clinicName
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
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

    try {
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
        
        // Return success with the verification URL even if webhook fails
        return new Response(
          JSON.stringify({ 
            message: "User created successfully but webhook failed", 
            success: true,
            email: userData.email,
            verificationUrl: verificationUrl,
            userId: userData.id,
            clinicName: clinicName,
            webhookError: `${webhookResponse.status}: ${errorText}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
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
    } catch (webhookError) {
      console.error("Error sending to webhook:", webhookError);
      
      // Return success with the verification URL even if webhook fails
      return new Response(
        JSON.stringify({ 
          message: "User created successfully but webhook failed", 
          success: true,
          email: userData.email,
          verificationUrl: verificationUrl,
          userId: userData.id,
          clinicName: clinicName,
          webhookError: webhookError.message
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
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
      JSON.stringify({ error: error.message, stack: error.stack }),
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
  
  // Check if the token is valid by checking the user_verification table
  const { data: verificationData, error: verificationError } = await supabaseAdmin
    .from("user_verification")
    .select("*")
    .eq("user_id", userId)
    .eq("verification_token", token)
    .maybeSingle();
  
  if (verificationError || !verificationData) {
    console.error("Error retrieving verification record:", verificationError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Verification token not found" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
  
  // Check if verification has expired
  if (new Date(verificationData.expires_at) < new Date()) {
    console.error("Verification token has expired");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Verification token has expired" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
  
  // Mark the verification record as verified
  const { error: updateVerificationError } = await supabaseAdmin
    .from("user_verification")
    .update({ verified: true })
    .eq("user_id", userId);
  
  if (updateVerificationError) {
    console.error("Error updating verification record:", updateVerificationError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to update verification status" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
  
  // Mark the user as verified in the users table
  const { error: updateUserError } = await supabaseAdmin
    .from("users")
    .update({ verified: true })
    .eq("id", userId);
  
  if (updateUserError) {
    console.error("Error updating user verification status:", updateUserError);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to verify user account" }),
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

// Handler for resending verification emails
async function handleResendVerification(requestData: any, req: Request) {
  const { email, id } = requestData;
  
  if (!email) {
    return new Response(
      JSON.stringify({ error: "Missing email" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
  
  console.log("Processing resend verification request for:", email);
  
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
  
  let userId = id;
  
  // If no ID is provided, try to find the user by email
  if (!userId) {
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (userError || !userData) {
      console.error("User not found for email:", email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User not found with this email address" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    userId = userData.id;
  }
  
  // Generate a new verification token
  const verificationToken = generateVerificationToken(userId, email);
  
  // Update the verification record with the new token
  const expiryTime = new Date();
  expiryTime.setDate(expiryTime.getDate() + 1); // 24 hours from now
  
  const { error: verificationError } = await supabaseAdmin
    .from("user_verification")
    .upsert({
      user_id: userId,
      email: email,
      verification_token: verificationToken,
      expires_at: expiryTime.toISOString(),
      verified: false
    });
  
  if (verificationError) {
    console.error("Error storing new verification token:", verificationError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to generate new verification token" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
  
  // Generate the verification URL using clinipay.co.uk domain
  const verificationUrl = generateVerificationUrl(verificationToken, userId);
  
  // Get the user's clinic name
  const { data: userDetails, error: detailsError } = await supabaseAdmin
    .from("clinics")
    .select("clinic_name")
    .eq("id", userId)
    .single();
  
  const clinicName = userDetails?.clinic_name || "Your Clinic";
  
  // Send the verification data to the webhook
  const webhookUrl = Deno.env.get("NEW_SIGN_UP");
  if (!webhookUrl) {
    console.error("NEW_SIGN_UP webhook URL is not configured");
    
    // Return success with the verification URL even if webhook fails
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification token regenerated successfully but webhook failed",
        verificationUrl: verificationUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
  
  const webhookPayload = {
    email: email,
    verificationUrl: verificationUrl,
    userId: userId,
    clinicName: clinicName,
    timestamp: new Date().toISOString(),
    type: "resend"
  };
  
  console.log("Sending resend webhook payload:", JSON.stringify(webhookPayload));
  
  try {
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
      
      // Return success with the verification URL even if webhook fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Verification token regenerated successfully but webhook failed",
          verificationUrl: verificationUrl,
          webhookError: `${webhookResponse.status}: ${errorText}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    console.log("Successfully resent verification email");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email resent successfully",
        verificationUrl: verificationUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error sending verification email:", error);
    
    // Return success with the verification URL even if webhook fails
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification token regenerated successfully but webhook failed",
        verificationUrl: verificationUrl,
        webhookError: error.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
}
