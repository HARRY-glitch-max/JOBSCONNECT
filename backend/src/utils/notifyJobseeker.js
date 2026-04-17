import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This targets the .env file in the root /backend folder
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

export const notifyJobseeker = async ({ email, name, subject, message, ctaLink = "https://hireflow.com", ctaText = "Access Dashboard" }) => {
  // CRITICAL: Log to verify if the key is finally loaded
  console.log("-----------------------------------------");
  console.log("Checking .env at:", envPath);
  console.log("RESEND_API_KEY found:", process.env.RESEND_API_KEY ? "✅ YES" : "❌ NO");
  console.log("-----------------------------------------");

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Aborting email send: RESEND_API_KEY is not defined in .env");
    return;
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <tr>
                  <td bgcolor="#2563eb" style="padding: 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">HireFlow</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 48px 40px;">
                    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Hello ${name},</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">${subject}</p>
                    <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                      <p style="margin: 0; color: #1e293b;">${message}</p>
                    </div>
                    <table border="0" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${ctaLink}" style="background-color: #0f172a; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">${ctaText}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: "HireFlow <onboarding@resend.dev>",
      to: email,
      subject: `HireFlow: ${subject}`,
      html: htmlContent,
    });

    console.log(`🚀 Email successfully sent to ${email}`);
  } catch (error) {
    console.error("❌ Email Error:", error.message);
  }
};