
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
    const requestData = await req.json();
    const { returnUrl, action, accountId } = requestData;

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader && req.method !== 'POST') {
      throw new Error('Missing Authorization header');
    }

    // Extract the JWT token
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    // If action is 'check_account_status', verify the Stripe account status
    if (action === 'check_account_status' && accountId) {
      console.log(`Checking Stripe account status for: ${accountId}`);
      
      try {
        // Retrieve the account from Stripe with expanded capabilities
        const account = await stripe.accounts.retrieve(accountId, {
          expand: ['capabilities']
        });
        
        console.log("Account details:", JSON.stringify({
          charges_enabled: account.charges_enabled,
          details_submitted: account.details_submitted,
          payouts_enabled: account.payouts_enabled,
          capabilities: account.capabilities,
          requirements: account.requirements
        }, null, 2));
        
        let status = 'pending';
        
        // More comprehensive status determination
        if (account.charges_enabled && account.details_submitted && account.payouts_enabled) {
          status = 'connected';
          console.log(`Account ${accountId} is fully onboarded with all capabilities`);
          
          // Update the clinic database record immediately
          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          if (userError) {
            console.error("Error getting user:", userError.message);
          } else if (userData.user) {
            const { data: clinicData, error: clinicError } = await supabase
              .from('users')
              .select('clinic_id')
              .eq('id', userData.user.id)
              .single();
              
            if (clinicError) {
              console.error("Error getting clinic ID:", clinicError.message);
            } else if (clinicData?.clinic_id) {
              const { error: updateError } = await supabase
                .from('clinics')
                .update({ stripe_status: status })
                .eq('stripe_account_id', accountId);
                
              if (updateError) {
                console.error("Error updating clinic status:", updateError.message);
              } else {
                console.log(`Successfully updated clinic status to ${status}`);
              }
            }
          }
        } else if (account.details_submitted) {
          if (account.requirements?.currently_due?.length > 0) {
            status = 'review_pending';
            console.log(`Account ${accountId} is pending review with requirements: ${account.requirements.currently_due.join(', ')}`);
          } else {
            status = 'pending_verification';
            console.log(`Account ${accountId} has submitted details but is pending verification`);
          }
        } else if (!account.details_submitted) {
          status = 'pending';
          console.log(`Account ${accountId} has not completed onboarding`);
        }
        
        console.log(`Final account status for ${accountId}: ${status}`);
        
        return new Response(JSON.stringify({
          status: status,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requirements: account.requirements,
          updated: true
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 200
        });
      } catch (error) {
        console.error(`Error retrieving account ${accountId} from Stripe:`, error);
        return new Response(JSON.stringify({
          error: `Failed to retrieve Stripe account: ${error.message}`,
          status: 'error'
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 500
        });
      }
    }
    
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
      
      // Verify account status immediately and update if fully connected
      if (clinic?.stripe_account_id) {
        try {
          const account = await stripe.accounts.retrieve(clinic.stripe_account_id);
          
          // Update status if the account is fully onboarded
          if (account.charges_enabled && account.details_submitted && account.payouts_enabled) {
            const { error: updateError } = await supabase
              .from("clinics")
              .update({ stripe_status: 'connected' })
              .eq("id", clinicId);
              
            if (updateError) {
              console.error(`Error updating clinic status: ${updateError.message}`);
            } else {
              console.log(`Updated clinic ${clinicId} to 'connected' status`);
            }
          }
        } catch (error) {
          console.error(`Error checking account status: ${error.message}`);
        }
      }
      
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
      .select("stripe_account_id, stripe_status")
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
      
      // Update clinic with stripe account ID and set status to pending
      const { error: updateError } = await supabase
        .from("clinics")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_status: "pending"
        })
        .eq("id", clinicId);
        
      if (updateError) throw updateError;
    } else if (clinic.stripe_status !== "connected") {
      // If account exists but status is not active, check it with Stripe
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        let newStatus = 'pending';
        
        if (account.charges_enabled && account.details_submitted && account.payouts_enabled) {
          newStatus = 'connected';
        } else if (account.details_submitted) {
          newStatus = 'pending_verification';
        }
        
        // Update the status if it differs from the current one
        if (newStatus !== clinic.stripe_status) {
          const { error: updateError } = await supabase
            .from("clinics")
            .update({
              stripe_status: newStatus
            })
            .eq("id", clinicId);
            
          if (updateError) throw updateError;
        }
      } catch (error) {
        console.error('Error retrieving Stripe account:', error);
      }
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
