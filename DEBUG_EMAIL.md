# 🐛 Debug Email Not Sending

## Step 1: Check What Error You're Seeing

After the code updates, create a new passkey and look at the console. You should see detailed logs like:

```
📧 Attempting to send welcome email...
📧 Email: youremail@example.com
📧 Credential ID: cred_...
📧 Provider: Apple
📧 User Name: Your Name
📧 Is Welcome: true
```

Then you'll see EITHER:
- ✅ `Welcome email sent successfully!`
- ⚠️ `Email sending failed!` (with detailed error)

## Step 2: Check Supabase Function Logs

1. Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/functions/dynamic-api/logs
2. Look for recent invocations
3. Check for errors like:
   - "Missing RESEND_API_KEY"
   - "Resend API error"
   - Any other error messages

## Step 3: Verify the Function Was Deployed

1. Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/functions/dynamic-api
2. Check the code in the editor
3. Look for these key lines:
   ```typescript
   console.log("📧 Incoming email request:", { email, credentialId, provider, userName, isWelcome });
   ```
   If you don't see these console.log statements, the function wasn't deployed correctly.

## Step 4: Verify RESEND_API_KEY

1. Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/settings/functions
2. Check "Secrets" tab
3. Verify `RESEND_API_KEY` exists and starts with `re_`

## Step 5: Test Resend API Key Directly

To verify your Resend API key works, you can test it:

1. Go to: https://resend.com/api-keys
2. Find your API key
3. Go to: https://resend.com/emails
4. Send a test email to verify the key works

## Common Issues & Solutions

### Issue 1: "FunctionsHttpError: Edge Function returned a non-2xx status code"
**Cause**: Function code has an error or RESEND_API_KEY is missing
**Solution**: 
- Check function logs for the exact error
- Verify RESEND_API_KEY is set in Secrets
- Redeploy the function code

### Issue 2: "Resend API error: Missing API key"
**Cause**: RESEND_API_KEY environment variable not set
**Solution**: 
- Go to Functions → Secrets
- Add `RESEND_API_KEY` with your Resend API key (starts with `re_`)

### Issue 3: "Resend API error: Invalid API key"
**Cause**: Wrong or expired API key
**Solution**: 
- Generate a new API key at https://resend.com/api-keys
- Update the key in Supabase Secrets

### Issue 4: Function code not updated
**Cause**: Code wasn't deployed or deployed to wrong function
**Solution**: 
- Copy ALL code from `supabase/functions/send-passkey-email/index.ts`
- Paste into `dynamic-api` function in Supabase Dashboard
- Click "Deploy" button
- Wait for deployment to complete

### Issue 5: "onboarding@resend.dev not authorized"
**Cause**: Resend free tier limitations or domain issues
**Solution**: 
- This should work with `onboarding@resend.dev` (Resend's test email)
- Check if you need to verify your domain in Resend
- Or use a verified domain instead

## Step 6: Manual Function Test

You can test the function directly from Supabase:

1. Go to: https://supabase.com/dashboard/project/gfrnxqhivmgfgdersflu/functions/dynamic-api
2. Click "Invocations" tab
3. Click "Invoke" button
4. Use this test body:
   ```json
   {
     "email": "your-email@example.com",
     "credentialId": "test_credential_123",
     "provider": "Apple",
     "userName": "Test User",
     "isWelcome": true
   }
   ```
5. Click "Invoke function"
6. Check the response and logs

## What to Report Back

After running the updated code, please provide:

1. **Console output** - All the `📧` prefixed logs
2. **Error message** - The exact error from the Alert dialog
3. **Function logs** - From Supabase Functions → dynamic-api → Logs
4. **RESEND_API_KEY status** - Does it exist in Secrets? (Don't share the actual key!)

This will help identify the exact issue! 🔍
