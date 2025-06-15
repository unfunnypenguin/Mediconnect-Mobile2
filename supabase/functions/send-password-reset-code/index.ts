
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a random 6-digit code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a Supabase client with the service role key
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

    // Check if the user exists
    const { data: userExists, error: userExistsError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (userExistsError || !userExists) {
      // Don't reveal that the user doesn't exist for security reasons
      return new Response(
        JSON.stringify({ message: "If your email is registered, a verification code has been sent." }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a verification code
    const verificationCode = generateVerificationCode();
    const userId = userExists.id;
    
    // Set expiration time to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store the verification code in the database
    // First, check if there's an existing code for this user and delete it
    await supabaseAdmin
      .from("password_reset_codes")
      .delete()
      .eq("user_id", userId);

    // Insert the new code
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_codes")
      .insert({
        user_id: userId,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification code:", insertError);
      throw new Error("Failed to store verification code");
    }

    // Send the verification code via email
    const { error: emailError } = await supabaseAdmin.auth.admin.sendRawMagicLink({
      email,
      create_user: false,
      data: { verification_code: verificationCode }
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error("Failed to send verification code");
    }

    return new Response(
      JSON.stringify({ message: "Verification code sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-password-reset-code function:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
