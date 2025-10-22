# Passkey Authentication System - Supabase Implementation

This document explains the passkey authentication system that uses Supabase for storage instead of Firebase.

## Overview

The passkey system allows users to:
1. **Register** with biometric authentication (fingerprint/face ID)
2. **Login** using their stored passkeys
3. Store passkey credentials securely in Supabase

## Architecture

### Backend Components

#### 1. **passkeyService.js**
Location: `Backend/passkeyService.js`

**Functions:**
- `generatePasskey(userId)` - Generates a unique passkey credential
- `storePasskey(userId, credentialId, publicKey, provider)` - Stores passkey in Supabase
- `getPasskey(userId, credentialId)` - Retrieves a specific passkey
- `getUserPasskeys(userId)` - Gets all passkeys for a user
- `verifyPasskey(userId, credentialId)` - Verifies if a passkey exists

#### 2. **server.js API Endpoints**

**Registration Endpoint:**
```
POST /register
Body: { userID: string, provider: string }
Response: { message, userId, credentialId, passkey }
```

**Login Verification Endpoint:**
```
POST /login/verify
Body: { userID: string, assertion: { id: string } }
Response: { message, userId, authenticated: boolean }
```

**Get User Passkeys:**
```
GET /api/passkey/:userId
Response: { passkeys: [], count: number }
```

### Frontend Components

#### 1. **CreateCredential.js**
Location: `AyaApp/screens/Auth/CreateCredential.js`

- User enters email/phone
- Chooses provider (Apple/Google)
- Authenticates with biometrics
- Backend generates and stores passkey automatically
- Success animation shown
- Navigates to AccountForm

#### 2. **GetAssertion.js**
Location: `AyaApp/screens/Auth/GetAssertion.js`

- User initiates login
- Authenticates with biometrics
- Fetches user's passkeys from backend
- Verifies login with latest passkey
- Navigates to MainTabs on success

## Database Setup

### Supabase Configuration

**Connection Details:**
- URL: `https://gfrnxqhivmgfgdersflu.supabase.co`
- Project ID: `gfrnxqhivmgfgdersflu`
- Anon Key: (stored in passkeyService.js and supabaseClient.js)

### Database Schema

Run the migration file to create the passkeys table:

**File:** `Backend/supabase_passkeys_migration.sql`

**Table Structure:**
```sql
CREATE TABLE passkeys (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    provider TEXT DEFAULT 'biometric',
    created_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes:**
- `idx_passkeys_user_id` - Fast user lookup
- `idx_passkeys_credential_id` - Fast credential verification

**Row Level Security (RLS):**
- Users can only view/modify their own passkeys
- Anon role has access for unauthenticated passkey operations

## Setup Instructions

### 1. Run Database Migration

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `Backend/supabase_passkeys_migration.sql`
4. Click "Run" to execute the migration

### 2. Install Dependencies

```bash
cd Backend
npm install @supabase/supabase-js

cd ../AyaApp
npm install @supabase/supabase-js expo-local-authentication axios
```

### 3. Configure Backend

The backend is already configured with Supabase credentials in:
- `Backend/passkeyService.js`
- `Backend/server.js`

### 4. Start Backend Server

```bash
cd Backend
node server.js
```

The server will run on `http://localhost:3001` or the deployed URL: `https://dsw2b-backend.onrender.com`

## How It Works

### Registration Flow

1. User enters email/phone in `CreateCredential.js`
2. User clicks "Continue with Apple/Google"
3. System prompts for biometric authentication
4. On success, frontend sends request to `/register`
5. Backend generates unique passkey:
   - `credentialId`: `cred_{userId}_{timestamp}_{random}`
   - `rawId`: `raw_{userId}_{timestamp}_{random}`
6. Backend stores passkey in Supabase `passkeys` table
7. Frontend shows success animation
8. User navigates to account form

### Login Flow

1. User opens `GetAssertion.js` screen
2. User clicks "Authenticate"
3. System checks biometric availability
4. User authenticates with fingerprint/face
5. Frontend fetches user's passkeys: `GET /api/passkey/:userId`
6. Frontend sends verification request with latest passkey
7. Backend verifies passkey exists in database
8. On success, user navigates to main app

## Security Features

✅ **Biometric Authentication** - Uses device's fingerprint/face ID
✅ **Unique Credentials** - Each passkey is unique per user
✅ **Secure Storage** - Passkeys stored in Supabase with RLS
✅ **Row Level Security** - Users can only access their own passkeys
✅ **Provider Tracking** - Tracks which provider (Apple/Google) was used
✅ **Timestamp Tracking** - Records creation and last use times

## API Response Examples

### Successful Registration
```json
{
  "message": "Passkey registered successfully",
  "userId": "user@example.com",
  "credentialId": "cred_user@example.com_1729526400000_abc123",
  "passkey": {
    "id": "uuid-here",
    "user_id": "user@example.com",
    "credential_id": "cred_user@example.com_1729526400000_abc123",
    "public_key": "raw_user@example.com_1729526400000_abc123",
    "provider": "Apple",
    "created_at": "2025-10-21T10:00:00Z"
  }
}
```

### Successful Login
```json
{
  "message": "Login verified successfully",
  "userId": "user@example.com",
  "authenticated": true
}
```

### Get User Passkeys
```json
{
  "passkeys": [
    {
      "id": "uuid-1",
      "user_id": "user@example.com",
      "credential_id": "cred_user@example.com_1729526400000_abc123",
      "provider": "Apple",
      "created_at": "2025-10-21T10:00:00Z",
      "last_used_at": "2025-10-21T11:30:00Z"
    }
  ],
  "count": 1
}
```

## Testing

### Test Registration
1. Open app and navigate to CreateCredential screen
2. Enter email: `test@example.com`
3. Click "Continue with Apple" or "Continue with Google"
4. Complete biometric authentication
5. Check Supabase dashboard for new passkey entry

### Test Login
1. Navigate to GetAssertion screen
2. Ensure userID is set (from navigation params)
3. Click "Authenticate"
4. Complete biometric authentication
5. Should navigate to MainTabs on success

## Troubleshooting

### Issue: "No passkeys found"
**Solution:** User needs to register first using CreateCredential screen

### Issue: "Biometric not available"
**Solution:** Ensure device has fingerprint/face ID enabled

### Issue: "Failed to store passkey"
**Solution:** 
- Check Supabase credentials are correct
- Verify database migration was run
- Check RLS policies allow insertion

### Issue: "Invalid passkey credential"
**Solution:**
- Verify passkey exists in database
- Check credential_id matches what was stored

## Migration from Firebase

The system has been fully migrated from Firebase to Supabase:

✅ Removed Firebase dependencies
✅ Updated passkeyService.js to use Supabase
✅ Updated server.js endpoints
✅ Created Supabase migration file
✅ Updated frontend components
✅ Removed duplicate/old code

## Files Modified

- ✅ `Backend/passkeyService.js` - Complete rewrite for Supabase
- ✅ `Backend/server.js` - Updated endpoints and removed Firebase
- ✅ `AyaApp/screens/Auth/CreateCredential.js` - Updated registration flow
- ✅ `AyaApp/screens/Auth/GetAssertion.js` - Updated login flow
- ✅ `Backend/supabase_passkeys_migration.sql` - NEW: Database schema

## Next Steps

1. Run the Supabase migration
2. Test registration flow
3. Test login flow
4. Deploy backend with updated code
5. Test on physical device with biometrics

## Support

For issues or questions, check:
- Supabase dashboard for database entries
- Backend console logs for errors
- Frontend React Native debugger for client errors
