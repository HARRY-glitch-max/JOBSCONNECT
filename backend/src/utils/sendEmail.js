import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This targets the .env file in the root /backend folder
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

/**
 * REBRANDED: JOBCONNECT Email Utility
 * Supports jobseeker notifications, employer alerts, admin password reset, and system emails
 */
export const sendEmail = async ({ 
  to, 
  subject, 
  html,
  from = "JOBCONNECT <onboarding@resend.dev>"
}) => {
  // CRITICAL: Log to verify if the key is finally loaded
  console.log("-----------------------------------------");
  console.log("📧 Sending email to:", to);
  console.log("📧 Subject:", subject);
  console.log("Checking .env at:", envPath);
  console.log("RESEND_API_KEY found:", process.env.RESEND_API_KEY ? "✅ YES" : "❌ NO");
  console.log("-----------------------------------------");

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Aborting email send: RESEND_API_KEY is not defined in .env");
    throw new Error("Email service not configured. Please set RESEND_API_KEY in .env");
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true, 
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
      tls: { rejectUnauthorized: false }
    });

    const result = await transporter.sendMail({
      from: from,
      to: to,
      subject: `JOBCONNECT: ${subject}`,
      html: html,
    });

    console.log(`✅ Email successfully sent to ${to}`);
    return result;
  } catch (error) {
    console.error("❌ Email Error:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send password reset email to admin
 */
export const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              <tr>
                <td bgcolor="#2563eb" style="padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.05em;">
                    JOBCONNECT
                  </h1>
                  <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 14px;">Admin Portal</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 48px 40px;">
                  <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Hello ${name},</h2>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                    We received a request to reset the password for your JOBCONNECT Admin account.
                  </p>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                    Click the button below to create a new password. This link is valid for <strong>10 minutes</strong>.
                  </p>
                  
                  <table border="0" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin-top: 32px;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0; color: #3b82f6; font-size: 12px; word-break: break-all;">
                      ${resetUrl}
                    </p>
                  </div>
                  
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
                    If you didn't request this password reset, please ignore this email or contact support.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    This is an automated message from JOBCONNECT. Please do not reply to this email.
                  </p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
                    &copy; 2026 JOBCONNECT Portal. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: htmlContent,
  });
};

/**
 * Send password change confirmation email
 */
export const sendPasswordChangedEmail = async ({ email, name }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              <tr>
                <td bgcolor="#10b981" style="padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.05em;">
                    JOBCONNECT
                  </h1>
                  <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Security Update</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 48px 40px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 24px;">🔐</div>
                  <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Password Changed Successfully</h2>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                    Hello ${name},
                  </p>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                    The password for your JOBCONNECT Admin account has been successfully changed.
                  </p>
                  
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 12px; margin-bottom: 32px; text-align: left;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      ⚠️ If you did not make this change, please contact support immediately.
                    </p>
                  </div>
                  
                  <table border="0" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="https://jobconnect.com/login" style="background-color: #0f172a; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; display: inline-block;">
                          Log In to Your Account
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    &copy; 2026 JOBCONNECT Portal. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "Password Changed Successfully",
    html: htmlContent,
  });
};

/**
 * Original jobseeker notification function (preserved for backward compatibility)
 */
export const notifyJobseeker = async ({ 
  email, 
  name, 
  subject, 
  message, 
  ctaLink = "https://jobconnect.com",
  ctaText = "Access Dashboard" 
}) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              <tr>
                <td bgcolor="#2563eb" style="padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.05em;">
                    JOBCONNECT
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 48px 40px;">
                  <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Hello ${name},</h2>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">${subject}</p>
                  
                  <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                    <p style="margin: 0; color: #1e293b; font-weight: 500;">${message}</p>
                  </div>
                  
                  <table border="0" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="${ctaLink}" style="background-color: #0f172a; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; display: inline-block;">
                          ${ctaText}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    &copy; 2026 JOBCONNECT Portal. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: subject,
    html: htmlContent,
  });
};

/**
 * Send employer notification about new report
 */
export const notifyEmployerReport = async ({ email, companyName, reportDate, adminName }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              <tr>
                <td bgcolor="#8b5cf6" style="padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.05em;">
                    JOBCONNECT
                  </h1>
                  <p style="color: #e9d5ff; margin: 8px 0 0 0; font-size: 14px;">Hiring Report</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 48px 40px;">
                  <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Hello ${companyName},</h2>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                    A new hiring report has been generated for your organization by <strong>${adminName}</strong>.
                  </p>
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                    Report Date: ${new Date(reportDate).toLocaleString()}
                  </p>
                  
                  <div style="background-color: #f1f5f9; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                    <p style="margin: 0 0 16px 0; color: #1e293b; font-weight: 600;">📊 Report Includes:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #475569;">
                      <li>Total job postings and their status</li>
                      <li>Application statistics (pending, shortlisted, hired, rejected)</li>
                      <li>Interview metrics (scheduled, completed, cancelled)</li>
                      <li>Overall hiring pipeline analytics</li>
                    </ul>
                  </div>
                  
                  <table border="0" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="https://jobconnect.com/dashboard" style="background-color: #0f172a; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; display: inline-block;">
                          View Full Report
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    &copy; 2026 JOBCONNECT Portal. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "New Hiring Report Generated",
    html: htmlContent,
  });
};

export default sendEmail;