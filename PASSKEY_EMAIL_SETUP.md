# Passkey Email Setup Guide - Resend + Supabase

## Overview

This setup allows Aya App to send beautiful, branded emails to users containing their passkey credentials after registration.

## Architecture

```
User Registers → Generate Passkey → Store in Supabase → Send Email via Resend
                                                          ↓
                                    User receives branded email with passkey
```

## Setup Instructions

### Step 1: Sign up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address
4. You get 100 free emails per day (3,000 per month)

### Step 2: Get Your Resend API Key

1. Log into your Resend dashboard
2. Click on **"API Keys"** in the sidebar
3. Click **"Create API Key"**
4. Name it: `Aya App Production`
5. Copy the API key (starts with `re_`)
6. **Save it securely** - you'll need it in Step 4

### Step 3: Verify Your Domain (Optional but Recommended)

**For Production:**
1. In Resend dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `ayaapp.com`)
4. Add the provided DNS records to your domain
5. Wait for verification (usually a few minutes)

**For Testing:**
- You can use Resend's onboarding domain: `onboarding@resend.dev`
- This works immediately but has limitations

### Step 4: Add API Key to Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `gfrnxqhivmgfgdersflu`
3. Click **"Project Settings"** (gear icon) in the sidebar
4. Click **"Edge Functions"** → **"Environment Variables"**
5. Click **"Add Variable"**
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key (starts with `re_`)
6. Click **"Save"**

### Step 5: Deploy the Edge Function

You need to deploy the Supabase Edge Function to make it available.

#### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to your project:**
   ```bash
   cd C:\Users\qwabe\Desktop\Aya-aya\DSW2B_GROUP_PROJECT
   supabase link --project-ref gfrnxqhivmgfgdersflu
   ```

4. **Deploy the function:**
   ```bash
   supabase functions deploy send-passkey-email
   ```

5. **Verify deployment:**
   - Go to Supabase Dashboard → Edge Functions
   - You should see `send-passkey-email` listed

#### Option B: Manual Deployment via Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click **"Create a new function"**
3. Name it: `send-passkey-email`
4. Copy the entire contents of `supabase/functions/send-passkey-email/index.ts`
5. Paste it into the function editor
6. Click **"Deploy"**

### Step 6: Update Email Sender Address

In the Edge Function code, update the `from` address:

```typescript
from: "Aya App <noreply@ayaapp.com>", // Change to your verified domain
```

If using Resend's test domain:
```typescript
from: "Aya App <onboarding@resend.dev>",
```

### Step 7: Test the Email Function

1. Open your React Native app
2. Navigate to CreateCredential screen
3. Enter a valid email address
4. Complete registration with biometric auth
5. Check your email inbox!

## Email Template Features

The email includes:

✅ **Branded Aya App Design**
- Purple gradient header matching your app colors
- Aya butterfly logo (🦋)
- Professional layout

✅ **Passkey Display**
- Clearly shows the credential ID
- Provider badge (Apple/Google)
- Easy to copy format

✅ **Security Information**
- How to use the passkey
- Why passkeys are secure
- Best practices

✅ **Call-to-Action**
- Button to open the app
- Support links

✅ **Responsive Design**
- Works on mobile and desktop
- Clean, modern look

## File Structure

```
DSW2B_GROUP_PROJECT/
├── supabase/
│   └── functions/
│       └── send-passkey-email/
│           └── index.ts          # Edge Function code
├── AyaApp/
│   ├── lib/
│   │   └── passkeyService.js    # Updated with email function
│   └── screens/
│       └── Auth/
│           └── CreateCredential.js  # Sends email after registration
```

## How It Works

### Registration Flow with Email

```javascript
1. User enters email in CreateCredential screen
2. User completes biometric authentication
3. App generates unique passkey
4. App stores passkey in Supabase
5. App calls Supabase Edge Function to send email
   ↓
6. Edge Function calls Resend API
7. Resend sends beautifully designed email
8. User receives email with passkey
```

### Code Example

```javascript
// In CreateCredential.js
const { data: emailData, error: emailError } = await supabase.functions.invoke('send-passkey-email', {
  body: {
    email: userID,
    credentialId: credentialId,
    provider: provider,
    userName: userName,
  },
});
```

## Email Preview

The email will look like this:

```
┌─────────────────────────────────────┐
│  [Purple Gradient Header]           │
│          🦋                          │
│       Aya App                        │
│  Your Safety, Our Priority           │
└─────────────────────────────────────┘
│                                      │
│  Hello, [Name]! 👋                   │
│                                      │
│  Welcome to Aya App! Your passkey    │
│  has been successfully created...    │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ YOUR SECURE PASSKEY          │   │
│  │ cred_user_1234567890_abc123  │   │
│  │      🔐 Apple Passkey         │   │
│  └──────────────────────────────┘   │
│                                      │
│  [How to Use Your Passkey]           │
│  [Why Passkeys are Secure]           │
│                                      │
│  [Open Aya App Button]               │
│                                      │
└─────────────────────────────────────┘
```

## Customization

### Change Email Design

Edit `supabase/functions/send-passkey-email/index.ts`:

```typescript
function generatePasskeyEmail(email, credentialId, provider, userName) {
  // Modify the HTML template here
  // Change colors, layout, text, etc.
}
```

### Change Email Subject

```typescript
subject: "Your Aya App Passkey - Secure Login Credentials",
```

### Add Logo Image

Replace the emoji logo with an actual image:

```html
<img src="https://yourdomain.com/logo.png" alt="Aya App" style="width: 80px;" />
```

## Testing

### Test Email Sending

1. **Registration Test:**
   ```javascript
   Email: test@youremail.com
   Provider: Apple
   → Should receive email within seconds
   ```

2. **Check Email Delivery:**
   - Go to Resend Dashboard → Logs
   - You'll see all sent emails and their status

3. **Test Error Handling:**
   - Invalid email format
   - Network issues
   - API key problems

### Resend Dashboard

Monitor your emails:
- **Sent** - Successfully delivered emails
- **Failed** - Errors and reasons
- **Opens** - Track if users open emails (if tracking enabled)

## Pricing

### Resend Free Tier
- ✅ 100 emails/day
- ✅ 3,000 emails/month
- ✅ All features included
- ✅ Perfect for testing and small apps

### Paid Plans (if you grow)
- **$20/month** - 50,000 emails
- **$80/month** - 100,000 emails
- Custom plans available

## Troubleshooting

### Email Not Sending

**Check:**
1. Resend API key is correct in Supabase environment variables
2. Edge Function is deployed successfully
3. Email address is valid
4. Check Supabase Edge Function logs
5. Check Resend dashboard for errors

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check RESEND_API_KEY in Supabase settings |
| "Email not received" | Check spam folder, verify email address |
| "Function not found" | Deploy the Edge Function |
| "Rate limit exceeded" | You've hit the 100/day limit (upgrade or wait) |

### Check Edge Function Logs

```bash
supabase functions logs send-passkey-email
```

Or in Dashboard:
1. Go to Edge Functions
2. Click on `send-passkey-email`
3. View logs tab

## Security Considerations

✅ **API Key Security:**
- Never commit API keys to git
- Store in Supabase environment variables only
- Rotate keys periodically

✅ **Email Content:**
- Passkey is shown but not the private key
- Users authenticate with biometrics
- Email is just for reference

✅ **HTTPS Only:**
- All API calls are encrypted
- Supabase uses HTTPS
- Resend uses HTTPS

## Production Checklist

Before going live:

- [ ] Sign up for Resend account
- [ ] Get Resend API key
- [ ] Add API key to Supabase environment variables
- [ ] Verify your domain with Resend (recommended)
- [ ] Deploy Edge Function to Supabase
- [ ] Update `from` email address in code
- [ ] Test email sending with real email
- [ ] Verify email arrives in inbox (not spam)
- [ ] Customize email template with your branding
- [ ] Test error handling
- [ ] Monitor Resend dashboard for delivery rates

## Next Steps

1. ✅ Complete the Resend setup
2. ✅ Deploy the Edge Function
3. ✅ Test email sending
4. 🎨 Customize the email design
5. 📊 Monitor email delivery in Resend dashboard

## Support

- **Resend Docs:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Email Template:** `supabase/functions/send-passkey-email/index.ts`

## Summary

🎉 **Your passkey email system is ready!**

- ✅ Beautiful branded emails
- ✅ Automatic sending after registration
- ✅ Secure API key storage
- ✅ Professional email template
- ✅ Easy to customize

Just complete the Resend setup and deploy the Edge Function!
