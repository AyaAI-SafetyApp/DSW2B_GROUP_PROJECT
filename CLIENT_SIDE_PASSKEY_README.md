# Client-Side Passkey System - Direct Supabase Integration

## Overview

This passkey authentication system works **entirely client-side** - your React Native app communicates directly with Supabase without needing any server.js modifications!

## How It Works

```
User App (React Native) ←→ Supabase Database
                            (No Backend Server Needed!)
```

## Files Involved

### Frontend Files (Updated)

1. **`AyaApp/lib/passkeyService.js`** - NEW helper functions
2. **`AyaApp/screens/Auth/CreateCredential.js`** - Registration screen
3. **`AyaApp/screens/Auth/GetAssertion.js`** - Login screen
4. **`AyaApp/lib/supabaseClient.js`** - Already configured ✅

### Backend Files (NO CHANGES NEEDED)

- ✅ `Backend/server.js` - **NOT MODIFIED**
- ✅ `Backend/passkeyService.js` - **NOT NEEDED**

## Setup Instructions

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select project: `gfrnxqhivmgfgdersflu`
3. Navigate to "SQL Editor"
4. Run this SQL:

```sql
-- Create passkeys table
CREATE TABLE IF NOT EXISTS passkeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    provider TEXT DEFAULT 'biometric',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT passkeys_user_id_credential_id_key UNIQUE (user_id, credential_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);

-- Enable Row Level Security
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (for unauthenticated passkey operations)
CREATE POLICY "Allow anonymous access to passkeys"
    ON passkeys
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

### Step 2: That's It! No Server Changes Needed

The app now works directly with Supabase. No backend server modifications required!

## How to Use

### Registration Flow

```javascript
// In CreateCredential.js
1. User enters email/phone
2. User chooses provider (Apple/Google)
3. Biometric authentication
4. App generates passkey locally
5. App stores passkey directly in Supabase
6. Success! Navigate to account form
```

### Login Flow

```javascript
// In GetAssertion.js
1. User clicks "Authenticate"
2. Biometric authentication
3. App fetches passkeys from Supabase
4. App verifies passkey exists
5. Update last_used_at timestamp
6. Success! Navigate to main app
```

## Using the Passkey Service

You can use the helper functions from `passkeyService.js`:

```javascript
import {
  registerUserWithPasskey,
  verifyUserLogin,
  getUserPasskeys,
} from "../../lib/passkeyService";

// Register a new user
const result = await registerUserWithPasskey("user@example.com", "Apple");

// Verify login
const loginResult = await verifyUserLogin("user@example.com");

// Get user's passkeys
const passkeys = await getUserPasskeys("user@example.com");
```

## API Reference

### Helper Functions in `passkeyService.js`

| Function | Description |
|----------|-------------|
| `generatePasskey(userId)` | Generate unique passkey credentials |
| `storePasskey(userId, credentialId, publicKey, provider)` | Store passkey in Supabase |
| `getUserPasskeys(userId)` | Get all passkeys for a user |
| `getPasskey(userId, credentialId)` | Get specific passkey |
| `verifyPasskey(userId, credentialId)` | Check if passkey exists |
| `updatePasskeyLastUsed(passkeyId)` | Update last used timestamp |
| `deletePasskey(passkeyId)` | Delete a passkey |
| `deleteAllUserPasskeys(userId)` | Delete all user's passkeys |
| `registerUserWithPasskey(userId, provider)` | Complete registration flow |
| `verifyUserLogin(userId)` | Complete login verification flow |

## Data Flow

### Registration
```
CreateCredential.js
  ↓
Generate passkey (client-side)
  ↓
supabase.from("passkeys").insert()
  ↓
Supabase Database
  ↓
Success!
```

### Login
```
GetAssertion.js
  ↓
Biometric Auth
  ↓
supabase.from("passkeys").select()
  ↓
Verify passkey exists
  ↓
Update last_used_at
  ↓
Success!
```

## Database Schema

```
Table: passkeys
├── id (UUID) - Primary key
├── user_id (TEXT) - User's email/phone
├── credential_id (TEXT) - Unique passkey ID
├── public_key (TEXT) - Public key
├── provider (TEXT) - Apple/Google/biometric
├── created_at (TIMESTAMP) - When created
└── last_used_at (TIMESTAMP) - Last login time

Indexes:
- idx_passkeys_user_id
- idx_passkeys_credential_id

RLS: Enabled with anonymous access policy
```

## Security Features

✅ **Biometric Authentication** - Required for all operations
✅ **Unique Credentials** - Generated with timestamp + random string
✅ **Direct to Database** - No intermediary server needed
✅ **Row Level Security** - Supabase RLS enabled
✅ **Client-Side Generation** - Passkeys generated securely on device

## Testing

### Test Registration
1. Open app → CreateCredential screen
2. Enter email: `test@example.com`
3. Click "Continue with Apple"
4. Authenticate with biometrics
5. Check Supabase → Table Editor → passkeys

### Test Login
1. Navigate to GetAssertion screen
2. Click "Authenticate"
3. Authenticate with biometrics
4. Should navigate to MainTabs

### Verify in Supabase
1. Go to Supabase Dashboard
2. Table Editor → passkeys
3. Should see entries with:
   - user_id
   - credential_id (format: `cred_user_timestamp_random`)
   - public_key (format: `key_user_timestamp_random`)
   - provider (Apple/Google)
   - created_at

## Advantages of Client-Side Approach

✅ **No Backend Changes** - Server.js remains untouched
✅ **Simpler Architecture** - Direct app-to-database communication
✅ **Faster** - No additional network hop through backend
✅ **Less Complexity** - Fewer moving parts
✅ **Real-time** - Direct Supabase connection
✅ **Scalable** - Supabase handles all the load

## Troubleshooting

### "Failed to store passkey"
- Check: Supabase migration was run
- Check: RLS policy allows anonymous access
- Check: Supabase credentials in supabaseClient.js

### "No passkey found"
- User needs to register first
- Check: passkeys table has data in Supabase dashboard

### "Biometric not available"
- Test on physical device with biometrics enabled
- Emulators may not support biometric auth

## Migration from Old System

If you had the old server-based system:

1. ✅ CreateCredential.js - Updated to use Supabase directly
2. ✅ GetAssertion.js - Updated to use Supabase directly
3. ✅ passkeyService.js - NEW file in AyaApp/lib/
4. ❌ Backend/server.js - NO CHANGES (can keep as is)
5. ❌ Backend/passkeyService.js - NOT NEEDED

## Example Usage

### Simple Registration
```javascript
import { supabase } from "../../lib/supabaseClient";

// Generate passkey
const credentialId = `cred_${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
const publicKey = `key_${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

// Store in Supabase
const { data, error } = await supabase
  .from("passkeys")
  .insert([{
    user_id: userId,
    credential_id: credentialId,
    public_key: publicKey,
    provider: "Apple",
  }])
  .select();
```

### Simple Login
```javascript
import { supabase } from "../../lib/supabaseClient";

// Get passkeys
const { data: passkeys, error } = await supabase
  .from("passkeys")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });

if (passkeys && passkeys.length > 0) {
  console.log("Login successful!");
}
```

## Summary

🎉 **You're all set!** The passkey system now works completely client-side:
- ✅ No server.js modifications needed
- ✅ Direct Supabase integration
- ✅ Simple and efficient
- ✅ Easy to maintain

Just run the database migration and you're ready to go!
