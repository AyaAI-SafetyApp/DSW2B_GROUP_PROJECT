# Deploy Dynamic-API Edge Function for Passkey Emails

## Instructions

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/functions
   - Find the `dynamic-api` function
   - Click on it to edit

2. **Replace the Function Code**
   - Delete all existing code in the editor
   - Copy the ENTIRE code below and paste it into the editor
   - Click "Save" or "Deploy"

3. **Verify Environment Variable**
   - Make sure `RESEND_API_KEY` is set in Secrets
   - Path: Edge Functions → Secrets → Add `RESEND_API_KEY`

---

## Complete Edge Function Code (Copy Everything Below)

```typescript
// Supabase Edge Function to send passkey email via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasskeyEmailRequest {
  email: string;
  credentialId: string;
  provider: string;
  userName?: string;
  isWelcome?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, credentialId, provider, userName, isWelcome } = await req.json() as PasskeyEmailRequest;

    console.log("📧 Incoming email request:", { email, credentialId, provider, userName, isWelcome });

    if (!email || !credentialId) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({ error: "Email and credentialId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailSubject = isWelcome 
      ? "Welcome to Aya App - Your Passkey is Ready! 🦋"
      : "Your Aya App Passkey - Secure Login Credentials";

    console.log("📤 Sending email with subject:", emailSubject);

    // Send email via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Aya App <onboarding@resend.dev>",
        to: [email],
        subject: emailSubject,
        html: generatePasskeyEmail(email, credentialId, provider, userName, isWelcome),
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Resend API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    console.log("✅ Email sent successfully:", data);
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generatePasskeyEmail(
  email: string,
  credentialId: string,
  provider: string,
  userName?: string,
  isWelcome?: boolean
): string {
  const displayName = userName || email.split("@")[0];
  
  const welcomeMessage = isWelcome 
    ? `
      <div class="message" style="background: linear-gradient(135deg, #fff5f7 0%, #ffd4e5 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h2 style="color: #FF1493; margin: 0 0 10px 0; font-size: 22px;">🎉 Welcome to Aya App!</h2>
        <p style="margin: 0; color: #333; font-size: 16px;">
          Thank you for joining our community dedicated to women's safety and empowerment. 
          We're excited to have you on this journey with us!
        </p>
      </div>
    `
    : '';

  const mainMessage = isWelcome
    ? `Your account has been successfully created! We've generated a secure passkey that will allow you to login quickly and safely using biometric authentication (fingerprint or face ID).`
    : `Welcome to <strong>Aya App</strong>! Your passkey has been successfully created and is ready to use. 
       This unique credential will allow you to securely access your account with biometric authentication.`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Aya App Passkey</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f7;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #FF1493 0%, #FFB6D9 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #1d1d1f;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #4a4a4a;
      margin-bottom: 30px;
    }
    .passkey-container {
      background: linear-gradient(135deg, #FFF0F8 0%, #FFE0F0 100%);
      border-radius: 15px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
      border: 2px solid #FFB6D9;
    }
    .passkey-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .passkey-value {
      font-size: 18px;
      font-weight: 700;
      color: #FF1493;
      background-color: rgba(255, 255, 255, 0.9);
      padding: 15px 20px;
      border-radius: 10px;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
      border: 1px dashed #FF1493;
    }
    .provider-badge {
      display: inline-block;
      background-color: #FF1493;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #FF1493;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .info-box-title {
      font-size: 16px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    .info-box-title::before {
      content: "🔒";
      margin-right: 10px;
      font-size: 20px;
    }
    .info-box ul {
      margin: 10px 0;
      padding-left: 20px;
      color: #4a4a4a;
      line-height: 1.8;
    }
    .info-box li {
      margin-bottom: 8px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #FF1493 0%, #FFB6D9 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: transform 0.2s;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 20, 147, 0.5);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #FF1493;
      text-decoration: none;
      font-weight: 500;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #FF1493;
      text-decoration: none;
      font-weight: 500;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <img src="https://gfrnxqhivmgfgdersflu.supabase.co/storage/v1/object/public/profile-pictures/e7184378-ffa6-420e-aa41-ae88064009f5/Aya_AI_Logo.png" alt="Aya App Logo" style="width: 80px; height: 80px; border-radius: 20px; object-fit: contain;" />
      </div>
      <h1>Aya App</h1>
      <p>Your Safety, Our Priority</p>
    </div>

    <!-- Content -->
    <div class="content">
      ${welcomeMessage}
      
      <div class="greeting">Hello, ${displayName}! 👋</div>
      
      <div class="message">
        ${mainMessage}
      </div>

      <!-- Passkey Container -->
      <div class="passkey-container">
        <div class="passkey-label">Your Secure Passkey</div>
        <div class="passkey-value">${credentialId}</div>
        <div class="provider-badge">🔐 ${provider} Passkey</div>
      </div>

      <div class="message">
        Keep this passkey safe! You'll use it along with your biometric authentication (fingerprint or face ID) 
        to securely log into your Aya App account.
      </div>

      <div class="divider"></div>

      <!-- Security Info -->
      <div class="info-box">
        <div class="info-box-title">How to Use Your Passkey</div>
        <ul>
          <li><strong>Login:</strong> Open Aya App and use your biometric authentication</li>
          <li><strong>Security:</strong> Your passkey is encrypted and stored securely</li>
          <li><strong>Multi-Device:</strong> Use the same passkey across all your devices</li>
          <li><strong>Never Share:</strong> Keep your passkey private and secure</li>
        </ul>
      </div>

      <div class="info-box">
        <div class="info-box-title">Why Passkeys are Secure</div>
        <ul>
          <li>✅ Protected by your device's biometric authentication</li>
          <li>✅ Unique cryptographic credentials for your account</li>
          <li>✅ Cannot be phished or stolen like traditional passwords</li>
          <li>✅ Works seamlessly across all your trusted devices</li>
        </ul>
      </div>

      <center>
        <a href="#" class="cta-button">Open Aya App</a>
      </center>

      <div class="divider"></div>

      <div class="message" style="font-size: 14px; color: #666;">
        <strong>Need Help?</strong><br>
        If you didn't request this passkey or need assistance, please contact our support team immediately.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Aya App - Empowering Women's Safety</strong></p>
      <p>This email was sent to ${email}</p>
      
      <div class="social-links">
        <a href="#">Privacy Policy</a> • 
        <a href="#">Terms of Service</a> • 
        <a href="#">Support</a>
      </div>
      
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Aya App. All rights reserved.<br>
        Protecting and empowering women through technology.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
```

---

## Testing

After deploying, test by:
1. Creating a new passkey in your app
2. Check the console logs for email sending confirmation
3. Check your email inbox for the welcome email

## Troubleshooting

If emails don't send:
1. Check Edge Function logs in Supabase Dashboard
2. Verify RESEND_API_KEY is set correctly
3. Make sure you're using `onboarding@resend.dev` as the sender (Resend's test email)
