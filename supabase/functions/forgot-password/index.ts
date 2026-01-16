import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ForgotPasswordRequest {
  email: string;
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

function getPasswordResetHtml(name: string, tempPassword: string, portalUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .credentials p { margin: 8px 0; }
    .temp-password { font-size: 24px; font-weight: bold; color: #0066cc; letter-spacing: 2px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset</h1>
  </div>
  <div class="content">
    <p>Dear ${name},</p>
    <p>We received a request to reset your password. Here is your temporary password:</p>
    
    <div class="credentials">
      <p><strong>Temporary Password:</strong></p>
      <p class="temp-password">${tempPassword}</p>
    </div>
    
    <div class="warning">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 10px 0;">
        <li>This temporary password expires in <strong>24 hours</strong></li>
        <li>You will be required to change your password immediately after logging in</li>
        <li>If you did not request this password reset, please contact HR immediately</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${portalUrl}" class="button">Login to Portal</a>
    </p>
    
    <p style="margin-top: 30px;">If you have any questions, please contact the HR department.</p>
    
    <p>Best regards,<br>MVC Corporation HR Team</p>
  </div>
  <div class="footer">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>© ${new Date().getFullYear()} MVC Corporation. All rights reserved.</p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email }: ForgotPasswordRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing forgot password for:", email);

    // Find the user by email in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.error("Error finding profile:", profileError);
      // Don't reveal if email exists
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a password reset email will be sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      console.log("No profile found for email:", email);
      // Don't reveal if email exists
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a password reset email will be sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update user's password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reset password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark old tokens as used
    await supabase
      .from('password_reset_tokens')
      .update({ is_used: true })
      .eq('user_id', profile.id)
      .eq('is_used', false);

    // Store the token record (we store a hash representation for audit, not the actual password)
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        temp_password_hash: 'reset_' + Date.now(), // Audit trail only
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (tokenError) {
      console.error("Error storing token:", tokenError);
      // Continue anyway - the password was already reset
    }

    // Set must_change_password flag
    const { error: flagError } = await supabase
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', profile.id);

    if (flagError) {
      console.error("Error setting must_change_password flag:", flagError);
    }

    // Send email with temporary password
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPassword,
        },
      },
    });

    const portalUrl = "https://migrant-path-hr.lovable.app/auth";
    const fullName = `${profile.first_name} ${profile.last_name}`;

    await client.send({
      from: `MVC Corporation <${gmailUser}>`,
      to: profile.email,
      subject: "Password Reset - MVC Corporation HR Portal",
      content: "Please view this email in an HTML-capable email client.",
      html: getPasswordResetHtml(fullName, tempPassword, portalUrl),
    });

    await client.close();

    console.log("Password reset email sent to:", profile.email);

    return new Response(
      JSON.stringify({ success: true, message: "If an account exists with this email, a password reset email will be sent." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in forgot-password:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
