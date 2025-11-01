# Supabase Edge Function Email Setup (No Backend Needed!)

## ✅ What Changed

**Before:** Required Express.js backend server running on localhost:3001
**After:** Uses Supabase Edge Functions (serverless, no backend needed!)

## 🚀 Quick Deploy (2 steps)

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Deploy the Email Function
```bash
# Login to Supabase
supabase login

# Link your project (use your project ref from Supabase dashboard)
supabase link --project-ref your-project-ref

# Set your Resend API key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Deploy the function
supabase functions deploy send-email
```

## 📧 Get Resend API Key (Free)

1. Go to https://resend.com/signup
2. Sign up (Free: 100 emails/day, 3,000/month)
3. Copy your API key (starts with `re_`)
4. Use in Step 2 above

## 🎯 How It Works Now

```
App → Supabase Edge Function → Resend → Email Sent ✉️
```

**No backend server needed!** Everything runs serverless through Supabase.

## 📱 Test Without Deploy (Development Mode)

If you haven't deployed the Edge Function yet:
- ✅ App will still work
- ✅ Code will be shown in Alert popup
- ✅ Perfect for testing the flow

## 🔍 Verify It's Working

After deployment, check:
```bash
# View function logs
supabase functions logs send-email

# Test the function
curl -i --location --request POST 'https://your-project-ref.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","code":"123456","userName":"Test","type":"reactivation"}'
```

## 📊 Email Types Supported

1. **Reactivation** - Sends 6-digit code
   ```js
   { type: 'reactivation', email, code, userName }
   ```

2. **Deactivation** - Account suspended notice
   ```js
   { type: 'deactivation', email, userName }
   ```

3. **Deletion** - Account deleted confirmation
   ```js
   { type: 'deletion', email, userName }
   ```

## 💡 Benefits of This Approach

✅ **No Backend Server** - Runs serverless on Supabase
✅ **Auto-Scaling** - Handles any load automatically
✅ **Secure** - API keys stored in Supabase secrets
✅ **Free Tier** - 500K function invocations/month
✅ **CORS Handled** - Works from any domain
✅ **Logs & Monitoring** - Built into Supabase dashboard

## 🎉 Ready to Use!

The app is already updated to use Supabase Edge Functions. Just deploy when you're ready!

**Development Mode:** Works now with code alerts
**Production Mode:** Deploy the function + add Resend key
