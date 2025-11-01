# Account Reactivation System - Setup Guide

## Overview
This guide covers the complete account reactivation system that allows deactivated users to regain access through email verification with a 6-digit code.

## What Was Implemented

### 1. **Database Schema** (`Backend/reactivation_codes_schema.sql`)
A new table to store reactivation verification codes with:
- 6-digit verification codes
- Email tracking
- 24-hour expiration
- One-time use enforcement
- Automatic cleanup of expired codes

### 2. **Reactivation Screen** (`screens/ReactivateAccountScreen.js`)
A complete two-step verification flow:
- **Step 1**: User enters their email
  - Validates if account is deactivated
  - Generates 6-digit code
  - Saves to database with 24-hour expiry
  - (Dev mode: Shows code in alert)
- **Step 2**: User enters verification code
  - Validates code against database
  - Checks if expired or already used
  - Reactivates account (`is_active = true`)
  - Marks code as used
  - Redirects to login

### 3. **Login Screen Updates** (`screens/LoginScreen.js`)
Added "Reactivate Account" link:
- Positioned next to "Forgot Password?" link
- Navigates to ReactivateAccount screen
- Styled in green to differentiate from forgot password

### 4. **Navigation Integration** (`App.js`)
- Imported ReactivateAccountScreen
- Added navigation route: `ReactivateAccount`

## Setup Instructions

### Step 1: Run Database Migration
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `Backend/reactivation_codes_schema.sql`
4. Copy all contents
5. Paste into SQL Editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success (should see "Success. No rows returned")

### Step 2: Verify Database Structure
After running the migration, verify the table was created:

```sql
SELECT * FROM reactivation_codes LIMIT 1;
```

You should see columns:
- `id` (UUID)
- `user_email` (TEXT)
- `code` (TEXT)
- `is_used` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)
- `used_at` (TIMESTAMP, nullable)

### Step 3: Test the Flow

#### A. Deactivate an Account
1. Open the app
2. Login to a test account
3. Go to Profile → Settings
4. Click "Deactivate Account"
5. Confirm deactivation
6. You'll be signed out

#### B. Try to Login (Should Be Blocked)
1. Go to Login screen
2. Try to login with the deactivated account
3. Should see alert: "Account is deactivated. Please contact support to reactivate your account."

#### C. Reactivate the Account
1. On Login screen, click **"Reactivate Account"** (green text)
2. Enter your email
3. Click "Send Verification Code"
4. **Development Mode**: Code will appear in an alert
5. Enter the 6-digit code
6. Click "Verify & Reactivate"
7. Account should be reactivated
8. You'll be redirected to Login screen

#### D. Login Again
1. Login with your credentials
2. Should work normally now

## Email Integration (Production Setup)

Currently, the verification code is shown in an **Alert** for development testing. For production, you need to integrate an email service.

### Option 1: Supabase Edge Function (Recommended)

Create a Supabase Edge Function to send emails:

```javascript
// supabase/functions/send-reactivation-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { email, code } = await req.json()
  
  // Use your email service (e.g., SendGrid, Resend)
  const emailResult = await sendEmail({
    to: email,
    subject: "Your Account Reactivation Code",
    html: `
      <h1>Reactivate Your Account</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code expires in 24 hours.</p>
    `
  })
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  })
})
```

Then update `ReactivateAccountScreen.js`:

```javascript
// Replace the Alert.alert line in handleSendCode() with:
const { data, error } = await supabase.functions.invoke('send-reactivation-email', {
  body: { email: email.trim(), code }
});

if (error) {
  Alert.alert('Error', 'Failed to send verification code. Please try again.');
  return;
}

Alert.alert(
  'Code Sent',
  'Please check your email for the verification code.'
);
```

### Option 2: External Email Service

Use services like:
- **SendGrid**: Commercial, reliable
- **AWS SES**: Cost-effective for high volume
- **Resend**: Developer-friendly
- **Mailgun**: Good for transactional emails

## Security Features

✅ **24-Hour Expiration**: Codes automatically expire after 24 hours
✅ **One-Time Use**: Codes can only be used once
✅ **Database Validation**: All verification happens server-side
✅ **Auto Cleanup**: Expired codes are automatically deleted
✅ **RLS Policies**: Row-level security enabled on reactivation_codes table
✅ **Indexed Queries**: Fast lookups by email and code

## Database Cleanup

The SQL schema includes an automatic cleanup function that runs periodically:

```sql
-- This function runs automatically to delete expired codes
DELETE FROM reactivation_codes 
WHERE expires_at < NOW() 
AND is_used = false;
```

You can also manually clean up:

```sql
SELECT cleanup_expired_reactivation_codes();
```

## Troubleshooting

### Problem: "No reactivation code found"
- **Cause**: Code expired or already used
- **Solution**: Request a new code

### Problem: Code not being saved to database
- **Cause**: Database schema not run
- **Solution**: Run `Backend/reactivation_codes_schema.sql` in Supabase

### Problem: Email shows "undefined"
- **Cause**: Email trimming or validation issue
- **Solution**: Check email input has `.trim()` applied

### Problem: Account still can't login after reactivation
- **Cause**: `is_active` flag not updated
- **Solution**: Check database query in `handleVerifyCode()`:
  ```sql
  UPDATE auth.users 
  SET raw_user_meta_data = 
    jsonb_set(raw_user_meta_data, '{is_active}', 'true') 
  WHERE email = $1;
  ```

## File Changes Summary

### Created Files:
1. ✅ `Backend/reactivation_codes_schema.sql` - Database schema
2. ✅ `screens/ReactivateAccountScreen.js` - Reactivation UI

### Modified Files:
1. ✅ `screens/LoginScreen.js` - Added reactivation link
2. ✅ `AyaApp/App.js` - Added navigation route

## Next Steps

1. ✅ Run the SQL migration in Supabase
2. ✅ Test the complete flow (deactivate → blocked login → reactivate → login)
3. ⏳ Integrate email service for production
4. ⏳ Add rate limiting (optional, to prevent abuse)
5. ⏳ Add analytics/logging for reactivation attempts

## Code Snippets for Reference

### Verify Code Function (from ReactivateAccountScreen.js)
```javascript
const handleVerifyCode = async () => {
  if (verificationCode.length !== 6) {
    Alert.alert('Invalid Code', 'Please enter a 6-digit code.');
    return;
  }

  setLoading(true);

  try {
    // 1. Verify code in database
    const { data: codeData, error: codeError } = await supabase
      .from('reactivation_codes')
      .select('*')
      .eq('user_email', email.trim())
      .eq('code', verificationCode)
      .eq('is_used', false)
      .single();

    if (codeError || !codeData) {
      Alert.alert('Invalid Code', 'The code you entered is incorrect or has expired.');
      setLoading(false);
      return;
    }

    // 2. Check if expired
    if (new Date(codeData.expires_at) < new Date()) {
      Alert.alert('Code Expired', 'This code has expired. Please request a new one.');
      setLoading(false);
      return;
    }

    // 3. Reactivate account
    const { error: updateError } = await supabase.rpc('reactivate_user_account', {
      user_email: email.trim()
    });

    if (updateError) {
      Alert.alert('Error', 'Failed to reactivate account. Please try again.');
      setLoading(false);
      return;
    }

    // 4. Mark code as used
    await supabase
      .from('reactivation_codes')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', codeData.id);

    Alert.alert(
      'Account Reactivated',
      'Your account has been successfully reactivated. You can now login.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  } catch (error) {
    console.error('Reactivation error:', error);
    Alert.alert('Error', 'An error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

## Support

If you encounter any issues:
1. Check Supabase logs in Dashboard → Logs
2. Check app console for errors (`console.error`)
3. Verify database table structure matches schema
4. Ensure RLS policies are enabled

---

**Status**: ✅ Ready to test (Development mode with Alert codes)
**Production Ready**: ⏳ Needs email integration
**Last Updated**: January 2025
