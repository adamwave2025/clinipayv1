import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
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
    // Get Stripe secret key from environment variables
    const stripeSecretKey = Deno.env.get("SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16"
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { returnUrl, action } = await req.json();

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader && req.method !== 'POST') {
      throw new Error('Missing Authorization header');
    }

    // Extract the JWT token
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    // If action is 'retrieve_account_id', this is a callback from Stripe
    if (action === 'retrieve_account_id') {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError) throw userError;
      
      // Get the clinic ID for the user
      const { data: userData, error: fetchUserError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();
        
      if (fetchUserError) throw fetchUserError;
      
      const clinicId = userData.clinic_id;
      
      // Get the clinic's Stripe account ID
      const { data: clinic, error: fetchError } = await supabase
        .from("clinics")
        .select("stripe_account_id")
        .eq("id", clinicId)
        .single();
        
      if (fetchError) throw fetchError;
      
      return new Response(JSON.stringify({
        accountId: clinic.stripe_account_id,
        clinicId: clinicId
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }

    // Otherwise, this is a request to create an onboarding link
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;

    // Get the clinic ID for the user
    const { data: userData, error: fetchUserError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();
      
    if (fetchUserError) throw fetchUserError;
    
    const clinicId = userData.clinic_id;
    if (!clinicId) {
      throw new Error("User is not associated with a clinic");
    }

    // Check if clinic already has a Stripe account
    const { data: clinic, error: fetchError } = await supabase
      .from("clinics")
      .select("stripe_account_id")
      .eq("id", clinicId)
      .single();
      
    if (fetchError) throw fetchError;
    
    let stripeAccountId = clinic?.stripe_account_id;
    
    if (!stripeAccountId) {
      // Create a new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: "express",
        metadata: {
          clinic_id: clinicId
        }
      });
      
      stripeAccountId = account.id;
      
      // Update clinic with stripe account ID
      const { error: updateError } = await supabase
        .from("clinics")
        .update({
          stripe_account_id: stripeAccountId
        })
        .eq("id", clinicId);
        
      if (updateError) throw updateError;
    }

    // Create an onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl || `${req.headers.get("origin")}/dashboard/settings`,
      return_url: returnUrl || `${req.headers.get("origin")}/dashboard/settings`,
      type: "account_onboarding"
    });

    return new Response(JSON.stringify({
      url: accountLink.url
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("Connect Onboarding Error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
