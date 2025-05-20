
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get("SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse the request body
    const data = await req.json();
    
    // Get the user from the auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get the user's clinic
    const { data: userClinic, error: clinicError } = await supabaseClient
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();
    
    if (clinicError) {
      throw new Error(`Error fetching clinic information: ${clinicError.message}`);
    }
    
    if (!userClinic?.clinic_id) {
      throw new Error("No clinic associated with this user");
    }
    
    // Get clinic details
    const { data: clinic, error: getClinicError } = await supabaseClient
      .from("clinics")
      .select("*")
      .eq("id", userClinic.clinic_id)
      .single();
    
    if (getClinicError) {
      throw new Error(`Error fetching clinic details: ${getClinicError.message}`);
    }
    
    // Handle different actions based on the request body
    if (data.action === "retrieve_account_id") {
      return handleRetrieveAccountId(clinic, userClinic.clinic_id);
    } else if (data.action === "check_account_status") {
      return handleCheckAccountStatus(data.accountId);
    } else if (data.returnUrl) {
      return handleCreateAccountLink(clinic, userClinic.clinic_id, data.returnUrl);
    } else {
      throw new Error("Missing required parameters");
    }
  } catch (error) {
    console.error(`Error in connect-onboarding function: ${error.message}`);
    console.error(error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Handler for creating a new account link
async function handleCreateAccountLink(clinic: any, clinicId: string, returnUrl: string) {
  try {
    // Check if the clinic already has a Stripe account ID
    let accountId = clinic.stripe_account_id;
    
    if (!accountId) {
      // Create a new Stripe account
      const account = await stripe.accounts.create({
        type: "standard",
        email: clinic.email,
        business_type: "company",
        company: {
          name: clinic.clinic_name || "Health Clinic",
        },
        metadata: {
          clinicId: clinicId,
        },
      });
      
      accountId = account.id;
      
      // Store the account ID in the database
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const { error: updateError } = await supabaseClient
        .from("clinics")
        .update({ 
          stripe_account_id: accountId,
          stripe_status: "pending" 
        })
        .eq("id", clinicId);
      
      if (updateError) {
        throw new Error(`Error updating clinic: ${updateError.message}`);
      }
    }
    
    // Create an account link to onboard the user
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    
    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId,
        clinicId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error(`Error in handleCreateAccountLink: ${error.message}`);
    throw error;
  }
}

// Handler for retrieving an existing account ID
function handleRetrieveAccountId(clinic: any, clinicId: string) {
  if (!clinic.stripe_account_id) {
    return new Response(
      JSON.stringify({ error: "No Stripe account associated with this clinic" }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      accountId: clinic.stripe_account_id,
      clinicId 
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

// Handler for checking an account's status
async function handleCheckAccountStatus(accountId: string) {
  if (!accountId) {
    return new Response(
      JSON.stringify({ error: "No account ID provided" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
  
  try {
    // Retrieve the account from Stripe to check its status
    const account = await stripe.accounts.retrieve(accountId);
    
    return new Response(
      JSON.stringify({
        id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error(`Error retrieving Stripe account: ${error.message}`);
    throw error;
  }
}
