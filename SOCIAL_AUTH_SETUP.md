# 🔐 Social Authentication Setup Guide

## ✅ Your Credentials

### Google OAuth
- **Client ID:** `250843888677-qgiiffabejo21rn372p2oaa22b56m7rq.apps.googleusercontent.com`
- **Client Secret:** `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`
- **Project ID:** `arched-proton-452514-n8`

### Supabase
- **Callback URL:** `https://gfrnxqhivmgfgdersflu.supabase.co/auth/v1/callback`
- **Project URL:** `https://gfrnxqhivmgfgdersflu.supabase.co`

---

## 📋 Setup Checklist

### 1. Google Cloud Console Setup ✅

1. **Add Authorized Redirect URI:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Select your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, add:
     ```
     https://gfrnxqhivmgfgdersflu.supabase.co/auth/v1/callback
     ```
   - Click **SAVE**

2. **Configure OAuth Consent Screen:**
   - Go to OAuth consent screen
   - Add your app logo
   - Add privacy policy URL
   - Add terms of service URL
   - Add authorized domains (if needed)

### 2. Supabase Dashboard Setup 📊

1. **Enable Google Provider:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to **Authentication** → **Providers**
   - Click on **Google**
   - Toggle **Enable Sign in with Google**
   - Enter:
     - **Client ID (for OAuth):** `250843888677-qgiiffabejo21rn372p2oaa22b56m7rq.apps.googleusercontent.com`
     - **Client Secret (for OAuth):** `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`
   - Click **Save**

2. **Enable Facebook Provider (Optional):**
   - In same **Providers** section
   - Click on **Facebook**
   - Follow similar steps once you create Facebook App

### 3. App Configuration 📱

The code has been updated with:
- ✅ Google Sign-In handler
- ✅ Facebook Sign-In handler  
- ✅ Connected to UI buttons
- ✅ Loading states
- ✅ Error handling

---

## 🎯 How It Works

### User Flow:
1. User taps Google/Facebook button
2. Opens OAuth browser popup
3. User authorizes the app
4. Redirects back to app with token
5. Supabase creates/logs in user
6. App receives user session
7. User is redirected to MainTabs

### Deep Linking:
The app uses `ayaai://auth/callback` for OAuth callbacks. Make sure to configure this in your `app.json`:

```json
{
  "expo": {
    "scheme": "ayaai",
    "ios": {
      "bundleIdentifier": "com.yourcompany.ayaapp"
    },
    "android": {
      "package": "com.yourcompany.ayaapp"
    }
  }
}
```

---

## 🧪 Testing

### Test Google Sign-In:
1. Make sure Google provider is enabled in Supabase
2. Run your app: `npm start`
3. Tap the Google icon button
4. You should see the Google OAuth screen
5. Select your Google account
6. App should log you in automatically

### Test Facebook Sign-In:
1. Complete Facebook App setup first
2. Enable Facebook provider in Supabase
3. Follow same steps as Google

---

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error:
- Double-check the callback URL is exactly:
  `https://gfrnxqhivmgfgdersflu.supabase.co/auth/v1/callback`
- Make sure it's saved in Google Cloud Console

### "Invalid client" Error:
- Verify Client ID and Secret are correct in Supabase
- Check that OAuth consent screen is configured

### OAuth Popup Not Opening:
- Check internet connection
- Verify Supabase project is active
- Check console logs for errors

---

## 🎨 Adding More Providers

Want to add Apple, Twitter, or other providers?

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable the provider you want
3. Follow the setup instructions for that provider
4. Add handler function in LoginScreen.js:
   ```javascript
   const handleAppleSignIn = async () => {
     const { data, error } = await supabase.auth.signInWithOAuth({
       provider: 'apple',
     });
   };
   ```
5. Connect to button

---

## 📝 Notes

- **Apple Sign-In** requires paid Apple Developer account
- **Facebook** requires published Facebook App
- **Twitter/GitHub** are easier to set up than others
- Always test on real devices for production

---

## ✅ Status

- [x] Google OAuth credentials created
- [x] Supabase callback URL obtained
- [ ] Add callback URL to Google Cloud Console
- [ ] Enable Google provider in Supabase
- [ ] Test Google Sign-In
- [ ] (Optional) Set up Facebook App
- [ ] (Optional) Enable Facebook provider
- [ ] (Optional) Test Facebook Sign-In

---

## 🔗 Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Facebook Developers](https://developers.facebook.com/)
