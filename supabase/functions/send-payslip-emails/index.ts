import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { format } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayslipEmailRequest {
  payroll_period_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { payroll_period_id }: PayslipEmailRequest = await req.json();

    if (!payroll_period_id) {
      return new Response(
        JSON.stringify({ error: "payroll_period_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get payroll period details
    const { data: period, error: periodError } = await supabase
      .from("payroll_periods")
      .select("*")
      .eq("id", payroll_period_id)
      .single();

    if (periodError || !period) {
      console.error("Error fetching payroll period:", periodError);
      return new Response(
        JSON.stringify({ error: "Payroll period not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all payroll records with employee details
    const { data: records, error: recordsError } = await supabase
      .from("payroll_records")
      .select(`
        *,
        employees(id, first_name, last_name, email, user_id)
      `)
      .eq("payroll_period_id", payroll_period_id);

    if (recordsError) {
      console.error("Error fetching payroll records:", recordsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch payroll records" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No payroll records found", emailsSent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    let emailsSent = 0;
    const errors: string[] = [];

    for (const record of records) {
      const employee = record.employees;
      if (!employee || !employee.email) {
        console.log(`Skipping employee without email: ${record.employee_id}`);
        continue;
      }

      const periodStart = format(new Date(period.period_start), "MMM dd, yyyy");
      const periodEnd = format(new Date(period.period_end), "MMM dd, yyyy");
      const netPay = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(record.net_pay || 0);

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .highlight { background: #f0f7ff; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: bold; color: #0066cc; }
    .period { color: #666; margin-bottom: 10px; }
    .button { display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Payslip is Ready</h1>
  </div>
  <div class="content">
    <p>Dear ${employee.first_name} ${employee.last_name},</p>
    <p>Your payslip for the following period is now available:</p>
    
    <div class="highlight">
      <p class="period">${periodStart} - ${periodEnd}</p>
      <p style="margin: 5px 0; color: #666;">Net Pay</p>
      <p class="amount">${netPay}</p>
    </div>
    
    <p>You can view and download your detailed payslip by logging into the HR portal.</p>
    
    <p style="text-align: center;">
      <a href="https://migrant-path-hr.lovable.app/my-payslips" class="button">View Payslip</a>
    </p>
    
    <p style="margin-top: 30px;">If you have any questions about your payslip, please contact the HR department.</p>
    
    <p>Best regards,<br>MVC Corporation HR Team</p>
  </div>
  <div class="footer">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>© ${new Date().getFullYear()} MVC Corporation. All rights reserved.</p>
  </div>
</body>
</html>`;

      try {
        await client.send({
          from: `MVC Corporation <${gmailUser}>`,
          to: employee.email,
          subject: `Your Payslip is Ready - ${periodStart} to ${periodEnd}`,
          content: "Please view this email in an HTML-capable email client.",
          html: html,
        });
        emailsSent++;
        console.log(`Email sent successfully to: ${employee.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${employee.email}:`, emailError);
        errors.push(`Failed to send to ${employee.email}`);
      }
    }

    await client.close();

    console.log(`Payslip emails sent: ${emailsSent}/${records.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${emailsSent} payslip emails`, 
        emailsSent,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending payslip emails:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
