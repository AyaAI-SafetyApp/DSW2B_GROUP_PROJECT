/**
 * Email Service using Resend API
 * 
 * This service handles all transactional emails for the Aya app:
 * - Account reactivation codes
 * - Account deactivation notifications
 * - Account deletion confirmations
 * 
 * Setup:
 * 1. Install Resend: npm install resend
 * 2. Add RESEND_API_KEY to .env file
 * 3. Verify sender domain in Resend dashboard
 */

require('dotenv').config();
const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email (must be verified in Resend)
const FROM_EMAIL = process.env.FROM_EMAIL || 'Aya Safety App <noreply@ayaapp.com>';
const APP_NAME = 'Aya Safety App';

/**
 * Send account reactivation code email
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} userName - User's name (optional)
 * @returns {Promise<object>} - Resend API response
 */
async function sendReactivationCode(email, code, userName = 'User') {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your ${APP_NAME} Reactivation Code`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 10px;
    }
    .code-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 48px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .info-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #777;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #e91e63;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ ${APP_NAME}</div>
      <h1 style="color: #333; margin: 0;">Account Reactivation</h1>
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>We received a request to reactivate your ${APP_NAME} account. Use the verification code below to complete the reactivation process:</p>

    <div class="code-container">
      <div class="code">${code}</div>
    </div>

    <div class="info-box">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This code expires in <strong>24 hours</strong></li>
        <li>This code can only be used <strong>once</strong></li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>

    <p>To reactivate your account:</p>
    <ol>
      <li>Open the ${APP_NAME} app</li>
      <li>Tap "Reactivate Account" on the login screen</li>
      <li>Enter your email address</li>
      <li>Enter the code: <strong>${code}</strong></li>
    </ol>

    <p>Once reactivated, you'll have full access to all your safety features including emergency alerts, trusted contacts, and safety resources.</p>

    <div class="footer">
      <p>This is an automated email from ${APP_NAME}.<br>
      If you need assistance, please contact our support team.</p>
      <p style="font-size: 12px; color: #999;">
        © 2025 ${APP_NAME}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Hello ${userName},

Your ${APP_NAME} account reactivation code is: ${code}

This code expires in 24 hours and can only be used once.

To reactivate your account:
1. Open the ${APP_NAME} app
2. Tap "Reactivate Account" on the login screen
3. Enter your email and this code

If you didn't request this, please ignore this email.

Best regards,
${APP_NAME} Team
      `
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      throw error;
    }

    console.log('✅ Reactivation code email sent:', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Failed to send reactivation code:', error);
    throw new Error('Failed to send reactivation code email');
  }
}

/**
 * Send account deactivation notification email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name (optional)
 * @returns {Promise<object>} - Resend API response
 */
async function sendDeactivationNotification(email, userName = 'User') {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your ${APP_NAME} Account Has Been Deactivated`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 10px;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #777;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ ${APP_NAME}</div>
      <h1 style="color: #333; margin: 0;">Account Deactivated</h1>
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>This email confirms that your ${APP_NAME} account has been successfully deactivated as per your request.</p>

    <div class="warning-box">
      <strong>⚠️ What This Means:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>You can no longer log into your account</li>
        <li>Your emergency contacts will no longer receive alerts</li>
        <li>Your safety features are now disabled</li>
        <li>Your data is preserved and can be restored</li>
      </ul>
    </div>

    <div class="info-section">
      <h3 style="margin-top: 0; color: #4CAF50;">🔄 Want to Come Back?</h3>
      <p style="margin-bottom: 0;">You can reactivate your account at any time by:</p>
      <ol style="margin-top: 10px;">
        <li>Opening the ${APP_NAME} app</li>
        <li>Clicking "Reactivate Account" on the login screen</li>
        <li>Following the verification process</li>
      </ol>
      <p style="margin-bottom: 0;"><strong>All your data will be restored immediately.</strong></p>
    </div>

    <div class="warning-box">
      <strong>🔒 Security Notice:</strong>
      <p style="margin: 10px 0 0 0;">If you didn't deactivate your account, please contact our support team immediately. Someone may have unauthorized access to your account.</p>
    </div>

    <div class="footer">
      <p>Thank you for using ${APP_NAME}.<br>
      We hope to see you again soon.</p>
      <p style="font-size: 12px; color: #999;">
        © 2025 ${APP_NAME}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Hello ${userName},

Your ${APP_NAME} account has been successfully deactivated.

What this means:
- You can no longer log into your account
- Your emergency contacts will no longer receive alerts
- Your safety features are now disabled
- Your data is preserved and can be restored

Want to come back?
You can reactivate your account at any time by:
1. Opening the ${APP_NAME} app
2. Clicking "Reactivate Account" on the login screen
3. Following the verification process

All your data will be restored immediately.

If you didn't deactivate your account, please contact support immediately.

Best regards,
${APP_NAME} Team
      `
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      throw error;
    }

    console.log('✅ Deactivation notification email sent:', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Failed to send deactivation notification:', error);
    throw new Error('Failed to send deactivation notification email');
  }
}

/**
 * Send account deletion confirmation email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's name (optional)
 * @returns {Promise<object>} - Resend API response
 */
async function sendDeletionConfirmation(email, userName = 'User') {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your ${APP_NAME} Account Has Been Deleted`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 10px;
    }
    .danger-box {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ ${APP_NAME}</div>
      <h1 style="color: #dc3545; margin: 0;">Account Deleted</h1>
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>This email confirms that your ${APP_NAME} account has been <strong>permanently deleted</strong> as per your request.</p>

    <div class="danger-box">
      <strong>❌ What Has Been Deleted:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Your profile information and settings</li>
        <li>All emergency contacts and trusted numbers</li>
        <li>Safety preferences and alert history</li>
        <li>Training progress and achievements</li>
        <li>All uploaded documents and media</li>
        <li>Subscription and payment information</li>
      </ul>
    </div>

    <div class="info-section">
      <h3 style="margin-top: 0; color: #333;">📝 Important Information:</h3>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li><strong>This action is permanent and cannot be undone</strong></li>
        <li>You will need to create a new account to use ${APP_NAME} again</li>
        <li>Any active subscriptions have been cancelled</li>
        <li>Emergency contacts will no longer receive alerts</li>
      </ul>
    </div>

    <div class="info-section">
      <h3 style="margin-top: 0; color: #4CAF50;">💚 Thank You</h3>
      <p style="margin: 10px 0;">Thank you for trusting ${APP_NAME} with your safety. We're sorry to see you go.</p>
      <p style="margin: 10px 0;">If you decide to return in the future, we'd be happy to welcome you back. You can create a new account at any time through our app.</p>
    </div>

    <div class="danger-box">
      <strong>🔒 Security Notice:</strong>
      <p style="margin: 10px 0 0 0;">If you didn't delete your account, please contact our support team immediately at <a href="mailto:support@ayaapp.com">support@ayaapp.com</a>.</p>
    </div>

    <div class="footer">
      <p>Stay safe out there!</p>
      <p style="font-size: 12px; color: #999;">
        © 2025 ${APP_NAME}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Hello ${userName},

Your ${APP_NAME} account has been permanently deleted as per your request.

What has been deleted:
- Your profile information and settings
- All emergency contacts and trusted numbers
- Safety preferences and alert history
- Training progress and achievements
- All uploaded documents and media
- Subscription and payment information

IMPORTANT:
- This action is permanent and cannot be undone
- You will need to create a new account to use ${APP_NAME} again
- Any active subscriptions have been cancelled
- Emergency contacts will no longer receive alerts

Thank you for trusting ${APP_NAME} with your safety. We're sorry to see you go.

If you didn't delete your account, please contact support immediately.

Stay safe!
${APP_NAME} Team
      `
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      throw error;
    }

    console.log('✅ Deletion confirmation email sent:', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Failed to send deletion confirmation:', error);
    throw new Error('Failed to send deletion confirmation email');
  }
}

/**
 * Test function to verify email service is working
 * @param {string} testEmail - Email address to send test to
 * @returns {Promise<object>}
 */
async function testEmailService(testEmail) {
  try {
    console.log('🧪 Testing email service...');
    
    const result = await sendReactivationCode(testEmail, '123456', 'Test User');
    
    console.log('✅ Email service test passed!');
    return result;
  } catch (error) {
    console.error('❌ Email service test failed:', error);
    throw error;
  }
}

module.exports = {
  sendReactivationCode,
  sendDeactivationNotification,
  sendDeletionConfirmation,
  testEmailService
};
