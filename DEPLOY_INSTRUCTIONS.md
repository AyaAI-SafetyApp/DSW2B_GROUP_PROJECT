# 🚀 Deploy Edge Function to Enable Welcome Emails

## The Issue
The welcome email is not being sent because the `dynamic-api` edge function in Supabase needs to be updated with the latest code.

## ✅ Quick Fix (5 minutes)

### Step 1: Copy the Function Code
1. Open the file: `supabase/functions/send-passkey-email/index.ts`
2. Select ALL the code (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 2: Deploy to Supabase
1. Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/functions
2. Click on the `dynamic-api` function
3. Delete all existing code in the editor
4. Paste the new code (Ctrl+V)
5. Click the **"Deploy"** button

### Step 3: Test
1. Open your Aya App
2. Create a new account with passkey
3. Check your email inbox for the welcome email
4. Watch the console for logs: `📧 Incoming email request`, `✅ Email sent successfully!`

---

## What Was Fixed

### Email Function (index.ts)
- ✅ Added console.log debugging statements
- ✅ Updated colors to Aya pink (#FF1493)
- ✅ Added Aya logo to email template
- ✅ Using `onboarding@resend.dev` sender

### Passkey Login (LoginScreen.js)
- ✅ Added biometric authentication for login
- ✅ Checks if user has saved passkey
- ✅ Shows "Login with Passkey" button if available
- ✅ No password needed after passkey setup
- ✅ Uses fingerprint/Face ID for authentication

---

## How It Works Now

### New Signup Flow:
1. **SignupScreen** → User enters email/password
2. **AccountForm** → User fills profile (auto-populated in next step)
3. **CreateCredential** → User creates passkey with biometric ✉️ **WELCOME EMAIL SENT**
4. **Subscription** → User chooses plan

### Login Flow:
- **With Passkey**: Just click "Login with Passkey" → Use fingerprint/Face ID → Logged in! 🔐
- **With Password**: Enter email + password → Logged in

---

## Environment Variables Already Set
- ✅ `RESEND_API_KEY` - Already configured in Supabase Secrets

---

## If Emails Still Don't Send

1. Check Supabase Function Logs:
   - Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/functions
   - Click on `dynamic-api`
   - Click "Logs" tab
   - Look for error messages

2. Verify RESEND_API_KEY:
   - Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/settings/functions
   - Check that `RESEND_API_KEY` exists
   - Test the key at https://resend.com/api-keys

3. Check console logs in your app for detailed error messages

---

## Summary

✅ **Passkey Login**: Users can now login with just fingerprint/Face ID (no password needed)  
✅ **Welcome Email**: Will be sent after deploying the edge function  
✅ **Auto-populated Form**: Passkey page uses data from profile page  
✅ **Branded Email**: Aya logo and pink colors throughout

**Next Step**: Deploy the edge function code to Supabase (Steps above) 🚀
