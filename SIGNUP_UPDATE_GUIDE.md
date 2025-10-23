# Signup & Welcome Email Update Guide

## ✅ What's Been Updated

I've enhanced your signup flow to collect the user's **full name** and send a **personalized welcome email** with their passkey. Here's what changed:

---

## 📝 Changes Made

### 1. **CreateCredential.js (Signup Page)** - Updated
**Location:** `AyaApp/screens/Auth/CreateCredential.js`

**Changes:**
- ✅ Added **Full Name** input field (appears before email/phone)
- ✅ Validates that full name is provided before registration
- ✅ Sends full name to Edge Function for personalized email
- ✅ Passes full name to AccountForm to pre-fill user's name
- ✅ Sets `isWelcome: true` flag to trigger welcome email template

**New Fields:**
```javascript
const [fullName, setFullName] = useState("");
const [nameFocused, setNameFocused] = useState(false);
```

**Validation:**
```javascript
if (!fullName.trim()) {
  setMessage("Please enter your full name");
  return;
}
```

**Email Payload:**
```javascript
{
  email: userID,
  credentialId: credentialId,
  provider: provider,
  userName: fullName.trim(),
  isWelcome: true  // Triggers welcome template
}
```

---

### 2. **AccountForm.js** - Updated
**Location:** `AyaApp/screens/Auth/AccountForm.js`

**Changes:**
- ✅ Now accepts `initialFullName` from signup
- ✅ Pre-fills the full name field with signup data
- ✅ User doesn't have to re-enter their name

**Navigation Update:**
```javascript
navigation.navigate("AccountForm", { 
  userID,
  initialFullName: fullName.trim() 
})
```

**State Initialization:**
```javascript
const { userID, initialFullName } = route.params;
const [fullName, setFullName] = useState(initialFullName || "");
```

---

### 3. **Edge Function (send-passkey-email/index.ts)** - Updated
**Location:** `supabase/functions/send-passkey-email/index.ts`

**Changes:**
- ✅ Added `isWelcome` parameter to interface
- ✅ Dynamic email subject based on `isWelcome` flag
- ✅ New welcome banner for first-time users
- ✅ Personalized greeting using full name

**Interface Update:**
```typescript
interface PasskeyEmailRequest {
  email: string;
  credentialId: string;
  provider: string;
  userName?: string;
  isWelcome?: boolean;  // NEW
}
```

**Email Subjects:**
- **Welcome Email:** "Welcome to Aya App - Your Passkey is Ready! 🦋"
- **Regular Email:** "Your Aya App Passkey - Secure Login Credentials"

**Welcome Banner (New Users Only):**
```html
<div style="background: linear-gradient(135deg, #fff5f7 0%, #ffd4e5 100%);">
  <h2>🎉 Welcome to Aya App!</h2>
  <p>Thank you for joining our community dedicated to women's safety 
     and empowerment. We're excited to have you on this journey!</p>
</div>
```

---

## 🎯 User Experience Flow

### **Before (Old Flow):**
1. User enters email/phone on signup
2. Biometric authentication
3. Passkey created and sent via email
4. User goes to AccountForm and enters name **again**

### **After (New Flow):**
1. User enters **Full Name** on signup
2. User enters email/phone
3. Biometric authentication
4. Passkey created + **Welcome email sent with personalized greeting**
5. AccountForm opens with name **pre-filled** ✨
6. User completes remaining fields (username, phone, location, age, gender)

---

## 📧 Email Templates

### **Welcome Email (New Users)**
**Triggered when:** `isWelcome: true`

**Features:**
- 🎉 Special welcome banner with gradient background
- 👋 Personalized greeting using full name
- 🦋 Aya App branding with butterfly logo
- 🔐 Passkey displayed in secure container
- ✅ Instructions on how to use the passkey
- 💡 Security tips and benefits

**Subject:** "Welcome to Aya App - Your Passkey is Ready! 🦋"

**Preview:**
```
Hello, Sarah Johnson! 👋

🎉 Welcome to Aya App!
Thank you for joining our community dedicated to women's safety 
and empowerment. We're excited to have you on this journey!

Your account has been successfully created! We've generated a 
secure passkey that will allow you to login quickly and safely 
using biometric authentication.

[Your Secure Passkey]
cred_sarah@example.com_1729641234567_abc123
🔐 Apple Passkey

How to Use Your Passkey:
✓ Login: Open Aya App and use biometric authentication
✓ Security: Your passkey is encrypted and stored securely
✓ Multi-Device: Use the same passkey across all devices
✓ Never Share: Keep your passkey private
```

---

### **Regular Passkey Email (Existing Users)**
**Triggered when:** `isWelcome: false` or undefined

**Features:**
- Standard passkey delivery
- Security information
- No welcome banner

**Subject:** "Your Aya App Passkey - Secure Login Credentials"

---

## 🔧 Deployment Steps

### **Step 1: Redeploy the Edge Function**

Since the Edge Function has been updated, you need to redeploy it to Supabase:

```bash
# Navigate to your project directory
cd C:\Users\qwabe\Desktop\Aya-aya\DSW2B_GROUP_PROJECT

# Deploy the updated function
supabase functions deploy dynamic-api --project-ref gfrnxqhivmgfgdersflu
```

**OR** manually update via Supabase Dashboard:
1. Go to https://app.supabase.com
2. Select project `gfrnxqhivmgfgdersflu`
3. Navigate to **Edge Functions** → `dynamic-api`
4. Click **Edit Function**
5. Copy contents of `supabase/functions/send-passkey-email/index.ts`
6. Paste and **Save**

---

### **Step 2: Test the Signup Flow**

1. **Clear app data** to test as a new user
2. Open Aya App → **Sign Up**
3. Fill in:
   - ✅ **Full Name:** "Jane Doe"
   - ✅ **Email:** your_test_email@gmail.com
4. Complete biometric authentication
5. Check your email for welcome message
6. Verify AccountForm has name pre-filled
7. Complete remaining profile fields

---

### **Step 3: Verify Email Delivery**

**Check Email Inbox:**
- Subject should be: "Welcome to Aya App - Your Passkey is Ready! 🦋"
- Greeting should show: "Hello, Jane Doe! 👋"
- Welcome banner should appear with gradient background
- Passkey should be displayed in the secure container

**Check Supabase Logs:**
```bash
# View function logs
supabase functions logs dynamic-api --project-ref gfrnxqhivmgfgdersflu
```

**OR** via Dashboard:
1. Go to **Edge Functions** → `dynamic-api`
2. Click **Logs** tab
3. Look for recent invocations
4. Verify no errors

---

## 🎨 UI Changes

### **Signup Screen (CreateCredential.js)**

**Before:**
```
┌─────────────────────────┐
│   Create Your Passkey   │
├─────────────────────────┤
│                         │
│  Email or Phone         │
│  ┌───────────────────┐  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  [Continue with Apple]  │
│  [Continue with Google] │
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│   Create Your Passkey   │
├─────────────────────────┤
│                         │
│  Full Name              │
│  ┌───────────────────┐  │
│  │ Jane Doe          │  │ ← NEW
│  └───────────────────┘  │
│                         │
│  Email or Phone         │
│  ┌───────────────────┐  │
│  │ jane@email.com    │  │
│  └───────────────────┘  │
│                         │
│  [Continue with Apple]  │
│  [Continue with Google] │
└─────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│ User enters  │
│  Full Name   │
│    Email     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Biometric   │
│    Auth      │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Generate Passkey    │
│  Store in Supabase   │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────┐
│  Trigger Edge Function │
│  (dynamic-api)         │
│                        │
│  Payload:              │
│  - email               │
│  - credentialId        │
│  - provider            │
│  - userName (FULL NAME)│
│  - isWelcome: true     │
└────────┬───────────────┘
         │
         ▼
┌─────────────────────────┐
│  Resend API sends       │
│  Welcome Email with:    │
│  - Full Name greeting   │
│  - Welcome banner       │
│  - Passkey              │
│  - Security tips        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Navigate to AccountForm│
│  with initialFullName   │
│  (pre-filled)           │
└─────────────────────────┘
```

---

## 🐛 Troubleshooting

### **Issue: Full name field not showing**
**Solution:** 
- Clear app cache: Settings → Apps → Aya App → Clear Cache
- Restart Metro bundler: `npx expo start --clear`

### **Issue: Welcome email not arriving**
**Check:**
1. Edge Function deployed correctly
2. Resend API key is set in Supabase environment
3. Email address is valid
4. Check spam folder

**Verify Environment Variable:**
```bash
# Check if RESEND_API_KEY is set
supabase secrets list --project-ref gfrnxqhivmgfgdersflu
```

### **Issue: Name not pre-filled in AccountForm**
**Check:**
- Navigation params include `initialFullName`
- `route.params` is being destructured correctly
- Full name was entered during signup

### **Issue: Email shows "undefined" instead of name**
**Check:**
- `userName` is being passed to Edge Function
- `fullName.trim()` is not empty
- Edge Function receives `userName` parameter

---

## 🔒 Security Considerations

### **Full Name Handling:**
- ✅ Trimmed to remove whitespace
- ✅ Validated before submission
- ✅ Stored in Supabase user_profiles table
- ✅ Not exposed in passkey credential

### **Email Security:**
- ✅ Sent via secure Resend API
- ✅ HTTPS encryption
- ✅ No sensitive data beyond passkey
- ✅ Passkey is encrypted in Supabase

### **Passkey Storage:**
- ✅ Stored in Supabase with RLS policies
- ✅ Linked to user_id
- ✅ Provider tracked (Apple/Google)
- ✅ Last used timestamp updated

---

## ✨ Benefits of This Update

1. **Better UX:** Users enter name once, it's reused everywhere
2. **Personalization:** Welcome email greets user by full name
3. **Professional:** Branded welcome experience for new users
4. **Seamless:** Name flows from signup → email → profile
5. **Validation:** Name is required before passkey generation
6. **No Duplication:** User doesn't re-enter data

---

## 📝 Next Steps (Optional Enhancements)

### **1. Add Name Validation:**
```javascript
const validateName = (name) => {
  if (name.length < 2) return "Name too short";
  if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters";
  return null;
};
```

### **2. Split First/Last Name:**
```javascript
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
```

### **3. Add Profile Picture to Email:**
If user uploads picture in AccountForm, include it in future emails

### **4. Send Follow-up Onboarding Email:**
After profile completion, send tips/tutorials email

---

## 🎉 Summary

Your signup flow now:
- ✅ Collects full name upfront
- ✅ Sends personalized welcome email with passkey
- ✅ Pre-fills name in profile form
- ✅ Creates professional first impression
- ✅ Reduces user friction (no duplicate data entry)

**To activate:** Redeploy the Edge Function and test signup!

**Need help?** Check Supabase logs or test with a real email address.
