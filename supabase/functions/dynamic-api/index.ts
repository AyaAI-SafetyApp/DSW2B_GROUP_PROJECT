// Supabase Edge Function for sending emails via Resend
// Handles: Passkey welcome, Reactivation, Deactivation, Deletion emails
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'Aya Safety App <noreply@mmqtech.co.za>'
const LOGO_URL = 'https://gfrnxqhivmgfgdersflu.supabase.co/storage/v1/object/public/profile-pictures/ayalg.jpg'

// Aya Brand Colors
const AYA_COLORS = {
  primary: '#FF1493',      // Deep Pink
  secondary: '#de0973',    // Pink Accent
  light: '#FFE4EC',        // Light Pink
  dark: '#c4106a',         // Dark Pink
  white: '#FFFFFF',
  bg: '#f9f3f6',           // Light Background
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body once
    const body = await req.json()
    const { email: rawEmail, credentialId, provider, userName, code, isWelcome, isReactivation, isDeactivation, isDeletion } = body

    // Clean and validate email
    const email = rawEmail?.trim().toLowerCase()
    
    console.log('📧 Email request received:', { email, isWelcome, isReactivation, isDeactivation, isDeletion })

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid email is required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Dev mode check
    if (!RESEND_API_KEY || RESEND_API_KEY === '' || RESEND_API_KEY === 'your_key') {
      console.warn('⚠️ RESEND_API_KEY not configured - running in dev mode')
      return new Response(
        JSON.stringify({ 
          success: true, 
          devMode: true,
          message: 'Email service not configured. Set RESEND_API_KEY to enable emails.',
          code: code
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let subject = ''
    let html = ''

    // Generate email based on type
    if (isWelcome) {
      subject = '🎉 Welcome to Aya - Your Passkey is Ready!'
      html = getPasskeyEmail(credentialId || 'N/A', provider || 'Passkey', userName || 'User')
    } else if (isReactivation) {
      subject = '🔐 Your Aya Account Reactivation Code'
      html = getReactivationEmail(code || '000000', userName || 'User')
    } else if (isDeactivation) {
      subject = '⏸️ Your Aya Account Has Been Deactivated'
      html = getDeactivationEmail(userName || 'User')
    } else if (isDeletion) {
      subject = '👋 Your Aya Account Has Been Deleted'
      html = getDeletionEmail(userName || 'User')
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email type' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: subject,
        html: html,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      console.log('✅ Email sent successfully')
      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('❌ Failed to send email:', data)
      return new Response(
        JSON.stringify({ success: false, error: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Email Templates
function getPasskeyEmail(credentialId: string, provider: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: ${AYA_COLORS.bg}; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: ${AYA_COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(255, 20, 147, 0.1); }
        .logo-container { text-align: center; padding: 20px; background: ${AYA_COLORS.white}; }
        .logo { width: 80px; height: 80px; }
        .header { background: linear-gradient(135deg, ${AYA_COLORS.primary} 0%, ${AYA_COLORS.secondary} 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { background: ${AYA_COLORS.bg}; padding: 30px; }
        .credential-box { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${AYA_COLORS.primary}; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .credential-id { font-family: 'Courier New', monospace; background: ${AYA_COLORS.light}; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 13px; color: ${AYA_COLORS.dark}; }
        .feature { margin: 15px 0; padding: 15px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .feature-icon { display: inline-block; margin-right: 10px; font-size: 20px; }
        .button { display: inline-block; background: linear-gradient(135deg, ${AYA_COLORS.primary} 0%, ${AYA_COLORS.secondary} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(255, 20, 147, 0.3); }
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 12px; background: ${AYA_COLORS.white}; }
        .footer-link { color: ${AYA_COLORS.primary}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <img src="${LOGO_URL}" alt="Aya Logo" class="logo" />
        </div>
        <div class="header">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">🎉 Welcome to Aya!</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.95;">Your Passkey Authentication is Active</p>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Great news! Your passkey has been successfully created and is ready to use. You can now sign in to Aya quickly and securely without remembering passwords.</p>
          
          <div class="credential-box">
            <h3>🔐 Your Passkey Details</h3>
            <p><strong>Provider:</strong> ${provider}</p>
            <p><strong>Credential ID:</strong></p>
            <div class="credential-id">${credentialId}</div>
          </div>

          <h3>✨ What is a Passkey?</h3>
          <p>Passkeys are a new way to sign in that's more secure and easier than passwords. Your passkey is stored securely on your device and uses biometric authentication (like Face ID or fingerprint).</p>

          <h3>🚀 Key Features:</h3>
          <div class="feature">
            <span class="feature-icon">🔒</span><strong>Ultra Secure:</strong> Uses public-key cryptography - your private key never leaves your device
          </div>
          <div class="feature">
            <span class="feature-icon">⚡</span><strong>Lightning Fast:</strong> Sign in with just a tap or glance - no typing required
          </div>
          <div class="feature">
            <span class="feature-icon">🛡️</span><strong>Phishing Resistant:</strong> Passkeys can't be tricked by fake websites
          </div>
          <div class="feature">
            <span class="feature-icon">🌐</span><strong>Cross-Device:</strong> Syncs across your devices via iCloud, Google Password Manager, or 1Password
          </div>

          <div style="text-align: center;">
            <a href="https://yourapp.com" class="button">Open Aya App</a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 10px 0;">💖 Stay safe with Aya</p>
          <p style="margin: 10px 0;">Need help? <a href="mailto:support@mmqtech.co.za" class="footer-link">support@mmqtech.co.za</a></p>
          <p style="margin: 10px 0; color: #9ca3af;">© 2025 Aya Safety App by MMQTech. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getReactivationEmail(code: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: ${AYA_COLORS.bg}; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: ${AYA_COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(255, 20, 147, 0.1); }
        .logo-container { text-align: center; padding: 20px; background: ${AYA_COLORS.white}; }
        .logo { width: 80px; height: 80px; }
        .header { background: linear-gradient(135deg, ${AYA_COLORS.primary} 0%, ${AYA_COLORS.secondary} 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { background: ${AYA_COLORS.bg}; padding: 30px; }
        .code-box { background: linear-gradient(135deg, ${AYA_COLORS.primary} 0%, ${AYA_COLORS.secondary} 100%); color: white; padding: 40px; border-radius: 16px; text-align: center; margin: 30px 0; font-size: 42px; font-weight: bold; letter-spacing: 10px; box-shadow: 0 8px 16px rgba(255, 20, 147, 0.3); }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 18px; border-radius: 10px; margin: 25px 0; }
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 12px; background: ${AYA_COLORS.white}; }
        .footer-link { color: ${AYA_COLORS.primary}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <img src="${LOGO_URL}" alt="Aya Logo" class="logo" />
        </div>
        <div class="header">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">🔐 Account Reactivation</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.95;">Your verification code is ready</p>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>We received a request to reactivate your Aya account. Use the code below to continue:</p>
          
          <div class="code-box">${code}</div>

          <div class="warning">
            <strong>⚠️ Important:</strong> This code expires in 24 hours and can only be used once.
          </div>

          <div style="background: white; padding: 20px; border-radius: 10px;">
            <p style="margin-top: 0;"><strong>🔒 Security Tips:</strong></p>
            <ul style="margin-bottom: 0;">
              <li>Never share this code with anyone</li>
              <li>Aya staff will never ask for your verification code</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 10px 0;">💖 We're here to keep you safe</p>
          <p style="margin: 10px 0;">Need help? <a href="mailto:support@mmqtech.co.za" class="footer-link">support@mmqtech.co.za</a></p>
          <p style="margin: 10px 0; color: #9ca3af;">© 2025 Aya Safety App by MMQTech. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getDeactivationEmail(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: ${AYA_COLORS.bg}; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: ${AYA_COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(255, 20, 147, 0.1); }
        .logo-container { text-align: center; padding: 20px; background: ${AYA_COLORS.white}; }
        .logo { width: 80px; height: 80px; }
  .header { background: linear-gradient(135deg, ${AYA_COLORS.primary} 0%, ${AYA_COLORS.secondary} 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { background: ${AYA_COLORS.bg}; padding: 30px; }
        .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 22px; border-radius: 12px; margin: 25px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, ${AYA_COLORS.primary} 0%, ${AYA_COLORS.secondary} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; box-shadow: 0 4px 6px rgba(255, 20, 147, 0.3); }
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 12px; background: ${AYA_COLORS.white}; }
        .footer-link { color: ${AYA_COLORS.primary}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <img src="${LOGO_URL}" alt="Aya Logo" class="logo" />
        </div>
        <div class="header">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">⏸️ Account Deactivated</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.95;">Your Aya account is now suspended</p>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your Aya account has been successfully deactivated. Your profile and data are preserved but temporarily inaccessible.</p>
          
          <div class="info-box">
            <h3>📋 What This Means:</h3>
            <ul>
              <li>✅ Your data is safe and preserved</li>
              <li>✅ You can reactivate anytime</li>
              <li>❌ You cannot sign in until reactivation</li>
              <li>❌ Your profile is hidden from other users</li>
            </ul>
          </div>

          <h3>🔄 Want to Come Back?</h3>
          <p>You can reactivate your account anytime by:</p>
          <ol>
            <li>Opening the Aya app</li>
            <li>Clicking "Reactivate Account" on the login screen</li>
            <li>Entering the verification code sent to your email</li>
          </ol>

          <div style="text-align: center;">
            <a href="https://yourapp.com/reactivate" class="button">Reactivate Account</a>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 10px 0;">💖 We'll be here when you're ready</p>
          <p style="margin: 10px 0;">Questions? <a href="mailto:support@mmqtech.co.za" class="footer-link">support@mmqtech.co.za</a></p>
          <p style="margin: 10px 0; color: #9ca3af;">© 2025 Aya Safety App by MMQTech. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getDeletionEmail(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: ${AYA_COLORS.bg}; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: ${AYA_COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(255, 20, 147, 0.1); }
        .logo-container { text-align: center; padding: 20px; background: ${AYA_COLORS.white}; }
        .logo { width: 80px; height: 80px; }
  .header { background: linear-gradient(135deg, ${AYA_COLORS.primary} 0%, ${AYA_COLORS.secondary} 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { background: ${AYA_COLORS.bg}; padding: 30px; }
        .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 22px; border-radius: 12px; margin: 25px 0; }
        .deleted-list { background: white; padding: 22px; border-radius: 12px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 12px; background: ${AYA_COLORS.white}; }
        .footer-link { color: ${AYA_COLORS.primary}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <img src="${LOGO_URL}" alt="Aya Logo" class="logo" />
        </div>
        <div class="header">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">👋 Account Deleted</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.95;">Your Aya account has been permanently removed</p>
        </div>
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your Aya account has been permanently deleted as requested. We're sorry to see you go!</p>
          
          <div class="warning-box">
            <h3>⚠️ This Action is Permanent</h3>
            <p>Your account and all associated data have been completely removed from our systems.</p>
          </div>

          <div class="deleted-list">
            <h3>🗑️ What Was Deleted:</h3>
            <ul>
              <li>User profile and personal information</li>
              <li>Passkey credentials</li>
              <li>Posts and media uploads</li>
              <li>Saved preferences and settings</li>
              <li>Activity history and logs</li>
            </ul>
          </div>

          <h3>💭 We Value Your Feedback</h3>
          <p>If you deleted your account due to an issue, we'd love to hear your feedback so we can improve. Please reach out to us at feedback@aya-app.com</p>

          <div style="background: white; padding: 22px; border-radius: 12px;">
            <h3 style="margin-top: 0; color: ${AYA_COLORS.primary};">🔄 Want to Return?</h3>
            <p>You're always welcome back! If you change your mind, you can create a new account anytime through the Aya app.</p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 10px 0;">💖 Thank you for being part of the Aya community</p>
          <p style="margin: 10px 0;">We'd love your feedback: <a href="mailto:feedback@mmqtech.co.za" class="footer-link">feedback@mmqtech.co.za</a></p>
          <p style="margin: 10px 0; color: #9ca3af;">© 2025 Aya Safety App by MMQTech. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
