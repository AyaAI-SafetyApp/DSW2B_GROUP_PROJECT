# Email Service Setup Guide - Resend Integration

## Overview
This guide covers the complete email service integration using **Resend** for the Aya Safety App. The service sends transactional emails for:

1. **Account Reactivation Codes** - 6-digit verification codes
2. **Account Deactivation Notifications** - Confirms account suspension
3. **Account Deletion Confirmations** - Final goodbye email

---

## Files Created/Modified

### ✅ New Files Created

1. **`Backend/emailService.js`** - Main email service module
   - Resend API integration
   - Three email templates with beautiful HTML
   - Error handling and logging
   - Test function for verification

2. **`Backend/.env.example`** - Environment variables template
   - Shows required API keys
   - Email configuration

### ✅ Modified Files

1. **`Backend/server.js`**
   - Added email service import
   - Added 4 new API endpoints:
     - `POST /api/email/send-reactivation-code`
     - `POST /api/email/send-deactivation-notification`
     - `POST /api/email/send-deletion-confirmation`
     - `POST /api/email/test`

2. **`AyaApp/screens/ReactivateAccountScreen.js`**
   - Updated to call email API when sending reactivation codes
   - Fallback to alert if email service is unavailable

3. **`AyaApp/screens/UserProfile/ProfileScreen.js`**
   - Added email notification on account deactivation
   - Added email confirmation on account deletion

---

## Setup Instructions

### Step 1: Install Resend Package

Navigate to the Backend directory and install Resend:

```bash
cd Backend
npm install resend
```

### Step 2: Get Resend API Key

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up for a free account (100 emails/day)
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy your API key (starts with `re_`)

### Step 3: Configure Environment Variables

Add to your `Backend/.env` file:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=Aya Safety App <noreply@ayaapp.com>
```

**Important Notes:**
- Replace `re_your_api_key_here` with your actual API key
- For development, you can use: `onboarding@resend.dev` as the sender
- For production, you MUST verify your domain in Resend

### Step 4: Verify Sender Domain (Production Only)

For production emails to work:

1. Log into Resend Dashboard
2. Go to **Domains** section
3. Click **Add Domain**
4. Enter your domain (e.g., `ayaapp.com`)
5. Add the DNS records shown (MX, TXT, CNAME)
6. Wait for verification (usually 5-10 minutes)
7. Update `FROM_EMAIL` in `.env` to use your domain

**Development Alternative:**
Use Resend's test address for development:
```env
FROM_EMAIL=onboarding@resend.dev
```

### Step 5: Test Email Service

Start your backend server:

```bash
cd Backend
npm start
```

Test the email service using curl or Postman:

```bash
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

You should receive a test reactivation code email!

---

## API Endpoints Documentation

### 1. Send Reactivation Code

**Endpoint:** `POST /api/email/send-reactivation-code`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "userName": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Reactivation code email sent successfully",
  "data": {
    "id": "resend-email-id"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to send reactivation code email"
}
```

---

### 2. Send Deactivation Notification

**Endpoint:** `POST /api/email/send-deactivation-notification`

**Request Body:**
```json
{
  "email": "user@example.com",
  "userName": "John Doe"
}
```

**Response:** Same format as above

---

### 3. Send Deletion Confirmation

**Endpoint:** `POST /api/email/send-deletion-confirmation`

**Request Body:**
```json
{
  "email": "user@example.com",
  "userName": "John Doe"
}
```

**Response:** Same format as above

---

### 4. Test Email Service

**Endpoint:** `POST /api/email/test`

**Request Body:**
```json
{
  "email": "your-test-email@example.com"
}
```

**Response:** Same format as above

---

## Email Templates

### 1. Reactivation Code Email

**Subject:** `Your Aya Safety App Reactivation Code`

**Features:**
- Beautiful gradient background for the code
- 48px large code display
- Clear expiration warning (24 hours)
- Step-by-step instructions
- Responsive design
- Security notice

**Preview:**
```
🛡️ Aya Safety App
Account Reactivation

Hello John Doe,

We received a request to reactivate your account...

[Large 6-digit code in gradient box]

⚠️ Important:
- This code expires in 24 hours
- Can only be used once
- Didn't request? Ignore this email
```

---

### 2. Deactivation Notification Email

**Subject:** `Your Aya Safety App Account Has Been Deactivated`

**Features:**
- Confirms deactivation
- Explains what it means
- Instructions to reactivate
- Security notice
- Clean, professional layout

---

### 3. Deletion Confirmation Email

**Subject:** `Your Aya Safety App Account Has Been Deleted`

**Features:**
- Red theme for severity
- Lists what was deleted
- Permanent action notice
- Thank you message
- Security alert

---

## Testing Workflow

### Test 1: Reactivation Code Email

1. Deactivate an account in the app
2. Sign out
3. Go to Login → "Reactivate Account"
4. Enter email
5. Check your email inbox (and spam folder!)
6. Verify code is received
7. Enter code in app
8. Account should be reactivated

### Test 2: Deactivation Notification

1. Login to the app
2. Go to Profile → Settings
3. Click "Deactivate Account"
4. Confirm deactivation
5. Check email for deactivation notification
6. Verify email contains correct information

### Test 3: Deletion Confirmation

1. Login to the app
2. Go to Profile → Settings
3. Click "Delete Account Permanently"
4. Type "DELETE" to confirm
5. Check email for deletion confirmation
6. Verify email lists all deleted data

---

## Troubleshooting

### Problem: "Failed to send email"

**Causes:**
- Invalid API key
- Unverified sender domain
- Rate limit exceeded (free plan: 100/day)
- Resend service down

**Solutions:**
1. Check API key in `.env` file
2. Verify domain in Resend dashboard
3. Check Resend dashboard for errors
4. Use `onboarding@resend.dev` for testing

---

### Problem: Emails go to spam

**Causes:**
- Unverified domain
- Missing DNS records
- Using free email providers

**Solutions:**
1. Verify your domain in Resend
2. Add all DNS records (SPF, DKIM, DMARC)
3. Use a custom domain, not Gmail/Yahoo
4. Add "Aya App" to trusted contacts

---

### Problem: Backend can't connect

**Causes:**
- Backend server not running
- Wrong port (should be 3001)
- CORS issues

**Solutions:**
1. Start backend: `cd Backend && npm start`
2. Check port in URL: `http://localhost:3001`
3. Verify CORS is enabled in `server.js`

---

### Problem: "resend is not defined"

**Causes:**
- Resend package not installed
- Import statement missing

**Solutions:**
```bash
cd Backend
npm install resend
```

---

## Development vs Production

### Development Mode
- Use `onboarding@resend.dev` as sender
- Emails viewable in Resend dashboard
- No domain verification needed
- 100 emails/day limit

### Production Mode
- Use custom domain (e.g., `noreply@ayaapp.com`)
- Domain must be verified
- DNS records required
- Upgrade Resend plan if needed

---

## Security Best Practices

1. **Never expose API key** - Keep in `.env`, never commit
2. **Validate email addresses** - Use regex before sending
3. **Rate limiting** - Prevent abuse (1 email per minute per user)
4. **Log all emails** - Track for debugging
5. **Monitor failures** - Set up alerts for failed emails

---

## Rate Limiting (Optional Enhancement)

To prevent abuse, add rate limiting:

```javascript
// In server.js
const emailRateLimit = {};

app.post('/api/email/send-reactivation-code', async (req, res) => {
  const { email } = req.body;
  
  // Check rate limit (1 email per minute)
  const lastSent = emailRateLimit[email];
  if (lastSent && Date.now() - lastSent < 60000) {
    return res.status(429).json({
      success: false,
      error: 'Please wait 1 minute before requesting another code'
    });
  }
  
  // ... rest of code ...
  
  emailRateLimit[email] = Date.now();
});
```

---

## Monitoring & Analytics

Track email performance in Resend Dashboard:
- Delivery rate
- Bounce rate
- Open rate (if enabled)
- Click rate (for links)

Set up webhooks for real-time notifications:
```javascript
app.post('/api/webhooks/resend', (req, res) => {
  const event = req.body;
  
  if (event.type === 'email.delivered') {
    console.log('✅ Email delivered:', event.data.email_id);
  }
  
  if (event.type === 'email.bounced') {
    console.log('❌ Email bounced:', event.data.email_id);
  }
  
  res.sendStatus(200);
});
```

---

## Cost Breakdown

### Free Plan
- 100 emails/day
- 3,000 emails/month
- Perfect for development & small apps

### Pro Plan ($20/month)
- 50,000 emails/month
- $1 per 1,000 additional
- Custom domains
- Analytics
- Priority support

### Enterprise
- Custom pricing
- Dedicated IP
- Advanced analytics
- White-label

---

## Next Steps

1. ✅ Install Resend package
2. ✅ Add API key to `.env`
3. ✅ Test with development email
4. ⏳ Verify custom domain (production)
5. ⏳ Add rate limiting
6. ⏳ Set up monitoring
7. ⏳ Design additional email templates (password reset, security alerts, etc.)

---

## Support

- **Resend Docs:** https://resend.com/docs
- **Resend API Reference:** https://resend.com/docs/api-reference
- **Support:** support@resend.com

---

**Status:** ✅ Ready for testing
**Last Updated:** November 2025
**Version:** 1.0.0
