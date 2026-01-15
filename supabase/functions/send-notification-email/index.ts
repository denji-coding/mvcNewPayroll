import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccountCreatedEmail {
  type: 'account_created';
  to: string;
  name: string;
  email: string;
  password: string;
  role: string;
  portalUrl: string;
}

interface LeaveApprovedEmail {
  type: 'leave_approved';
  to: string;
  name: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'approved' | 'rejected';
}

interface PayslipReadyEmail {
  type: 'payslip_ready';
  to: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  netPay: string;
}

type EmailRequest = AccountCreatedEmail | LeaveApprovedEmail | PayslipReadyEmail;

function getAccountCreatedHtml(data: AccountCreatedEmail): string {
  const roleLabel = data.role === 'hr_admin' ? 'HR Administrator' : 
                    data.role === 'branch_manager' ? 'Branch Manager' : 'Employee';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc; }
    .credentials p { margin: 8px 0; }
    .button { display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to MVC Corporation</h1>
  </div>
  <div class="content">
    <p>Dear ${data.name},</p>
    <p>Your account has been created successfully. You can now access the HR & Payroll Portal with the following credentials:</p>
    
    <div class="credentials">
      <p><strong>Role:</strong> ${roleLabel}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Password:</strong> ${data.password}</p>
    </div>
    
    <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
    
    <a href="${data.portalUrl}" class="button">Access Portal</a>
    
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

function getLeaveApprovedHtml(data: LeaveApprovedEmail): string {
  const isApproved = data.status === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusText = isApproved ? 'Approved' : 'Rejected';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details p { margin: 8px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Leave Request Update</h1>
  </div>
  <div class="content">
    <p>Dear ${data.name},</p>
    <p>Your leave request has been reviewed. Here is the status:</p>
    
    <p style="text-align: center; margin: 20px 0;">
      <span class="status-badge">${statusText}</span>
    </p>
    
    <div class="details">
      <p><strong>Leave Type:</strong> ${data.leaveType}</p>
      <p><strong>Start Date:</strong> ${data.startDate}</p>
      <p><strong>End Date:</strong> ${data.endDate}</p>
    </div>
    
    ${isApproved ? 
      '<p>Your leave has been approved. Please ensure all your pending tasks are properly handed over before your leave starts.</p>' :
      '<p>Unfortunately, your leave request has been rejected. Please contact your manager or HR for more details.</p>'
    }
    
    <p>Best regards,<br>MVC Corporation HR Team</p>
  </div>
  <div class="footer">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>© ${new Date().getFullYear()} MVC Corporation. All rights reserved.</p>
  </div>
</body>
</html>`;
}

function getPayslipReadyHtml(data: PayslipReadyEmail): string {
  return `
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
    <p>Dear ${data.name},</p>
    <p>Your payslip for the following period is now available:</p>
    
    <div class="highlight">
      <p class="period">${data.periodStart} - ${data.periodEnd}</p>
      <p style="margin: 5px 0; color: #666;">Net Pay</p>
      <p class="amount">${data.netPay}</p>
    </div>
    
    <p>You can view and download your detailed payslip by logging into the HR portal.</p>
    
    <p style="text-align: center;">
      <a href="https://migrant-path-hr.lovable.app/payroll" class="button">View Payslip</a>
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
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData: EmailRequest = await req.json();
    console.log("Sending email:", emailData.type, "to:", emailData.to);

    let subject = "";
    let html = "";

    switch (emailData.type) {
      case 'account_created':
        subject = "Welcome to MVC Corporation - Your Account Credentials";
        html = getAccountCreatedHtml(emailData);
        break;
      case 'leave_approved':
        subject = `Leave Request ${emailData.status === 'approved' ? 'Approved' : 'Rejected'}`;
        html = getLeaveApprovedHtml(emailData);
        break;
      case 'payslip_ready':
        subject = `Your Payslip is Ready - ${emailData.periodStart} to ${emailData.periodEnd}`;
        html = getPayslipReadyHtml(emailData);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    await client.send({
      from: `MVC Corporation <${gmailUser}>`,
      to: emailData.to,
      subject: subject,
      content: "Please view this email in an HTML-capable email client.",
      html: html,
    });

    await client.close();

    console.log("Email sent successfully to:", emailData.to);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
