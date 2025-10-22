# Passkey Authentication Flow Diagram

## Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PASSKEY REGISTRATION                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   User App   │         │   Backend    │         │   Supabase   │
│ (Mobile)     │         │   Server     │         │   Database   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. Enter Email         │                        │
       │    Click Register      │                        │
       │                        │                        │
       │ 2. Biometric Auth      │                        │
       │    (Face/Fingerprint)  │                        │
       │────────────────►       │                        │
       │                        │                        │
       │ 3. POST /register      │                        │
       │    { userID, provider }│                        │
       │───────────────────────►│                        │
       │                        │                        │
       │                        │ 4. Generate Passkey    │
       │                        │    credentialId =      │
       │                        │    cred_user_time_rand │
       │                        │                        │
       │                        │ 5. INSERT INTO passkeys│
       │                        │───────────────────────►│
       │                        │                        │
       │                        │ 6. Success Response    │
       │                        │◄───────────────────────│
       │                        │                        │
       │ 7. Return passkey data │                        │
       │◄───────────────────────│                        │
       │                        │                        │
       │ 8. Show Success ✓      │                        │
       │    Navigate to Account │                        │
       │                        │                        │
       ▼                        ▼                        ▼
```

## Login Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PASSKEY LOGIN                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   User App   │         │   Backend    │         │   Supabase   │
│ (Mobile)     │         │   Server     │         │   Database   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. Click Authenticate  │                        │
       │                        │                        │
       │ 2. Biometric Auth      │                        │
       │    (Face/Fingerprint)  │                        │
       │────────────────►       │                        │
       │                        │                        │
       │ 3. GET /api/passkey/   │                        │
       │    :userId             │                        │
       │───────────────────────►│                        │
       │                        │                        │
       │                        │ 4. SELECT * FROM       │
       │                        │    passkeys WHERE      │
       │                        │    user_id = :userId   │
       │                        │───────────────────────►│
       │                        │                        │
       │                        │ 5. Return passkeys[]   │
       │                        │◄───────────────────────│
       │                        │                        │
       │ 6. Return passkeys     │                        │
       │◄───────────────────────│                        │
       │                        │                        │
       │ 7. POST /login/verify  │                        │
       │    { userID, assertion }│                       │
       │───────────────────────►│                        │
       │                        │                        │
       │                        │ 8. Verify credential   │
       │                        │    exists in DB        │
       │                        │───────────────────────►│
       │                        │                        │
       │                        │ 9. Credential found ✓  │
       │                        │◄───────────────────────│
       │                        │                        │
       │ 10. Login Success      │                        │
       │     authenticated=true │                        │
       │◄───────────────────────│                        │
       │                        │                        │
       │ 11. Navigate to App    │                        │
       │                        │                        │
       ▼                        ▼                        ▼
```

## Database Schema

```
┌────────────────────────────────────────────────────────────┐
│                    PASSKEYS TABLE                          │
├──────────────┬──────────────┬────────────────────────────┤
│ Column       │ Type         │ Description                │
├──────────────┼──────────────┼────────────────────────────┤
│ id           │ UUID         │ Primary key                │
│ user_id      │ TEXT         │ User email/phone           │
│ credential_id│ TEXT (UNIQUE)│ Generated passkey ID       │
│ public_key   │ TEXT         │ Public key (rawId)         │
│ provider     │ TEXT         │ Apple/Google/biometric     │
│ created_at   │ TIMESTAMP    │ Registration time          │
│ last_used_at │ TIMESTAMP    │ Last login time            │
└──────────────┴──────────────┴────────────────────────────┘

Indexes:
  - idx_passkeys_user_id (user_id)
  - idx_passkeys_credential_id (credential_id)

Row Level Security (RLS): ENABLED
  ✓ Users can view their own passkeys
  ✓ Users can insert their own passkeys
  ✓ Users can update their own passkeys
  ✓ Users can delete their own passkeys
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND COMPONENTS                      │
└─────────────────────────────────────────────────────────────┘

CreateCredential.js
  ├── Input: Email/Phone
  ├── Button: Continue with Apple
  ├── Button: Continue with Google
  ├── LocalAuthentication (Biometric)
  └── Navigation → AccountForm

GetAssertion.js
  ├── Button: Authenticate
  ├── LocalAuthentication (Biometric)
  ├── Fetch User Passkeys
  ├── Verify Login
  └── Navigation → MainTabs

┌─────────────────────────────────────────────────────────────┐
│                     BACKEND COMPONENTS                       │
└─────────────────────────────────────────────────────────────┘

passkeyService.js
  ├── generatePasskey(userId)
  ├── storePasskey(userId, credentialId, publicKey, provider)
  ├── getPasskey(userId, credentialId)
  ├── getUserPasskeys(userId)
  └── verifyPasskey(userId, credentialId)

server.js (API Endpoints)
  ├── POST /register
  ├── POST /login/verify
  └── GET /api/passkey/:userId

┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
└─────────────────────────────────────────────────────────────┘

Supabase
  ├── Database: PostgreSQL
  ├── Table: passkeys
  ├── RLS Policies: Enabled
  └── Indexes: user_id, credential_id
```

## Security Features

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: Device Security
  ✓ Biometric authentication (Face ID / Fingerprint)
  ✓ Device fallback (PIN/Pattern)
  ✓ Local device encryption

Layer 2: Network Security
  ✓ HTTPS/TLS for all API calls
  ✓ Supabase secure connection
  ✓ API request validation

Layer 3: Database Security
  ✓ Row Level Security (RLS)
  ✓ User isolation
  ✓ Unique constraint on credential_id
  ✓ Indexed lookups

Layer 4: Authentication Security
  ✓ Unique passkey per user per registration
  ✓ Timestamp-based credential IDs
  ✓ Random string generation
  ✓ Provider tracking
```

## Error Handling Flow

```
Registration Errors:
  ├── No userID → "Enter email or phone"
  ├── Biometric failed → "Biometric authentication failed"
  ├── Network error → Show error message
  └── Database error → "Failed to register passkey"

Login Errors:
  ├── No biometric hardware → "Biometric not available"
  ├── Biometric failed → "Authentication failed"
  ├── No passkeys found → "No passkey found. Please register first."
  ├── Invalid credential → "Invalid passkey credential"
  └── Network error → "Failed to verify login"
```

## Data Flow Example

```
Registration Example:
Input:
  userID = "user@example.com"
  provider = "Apple"

Generated Passkey:
  credentialId = "cred_user@example.com_1729526400000_abc123xyz"
  rawId = "raw_user@example.com_1729526400000_abc123xyz"
  type = "public-key"

Database Entry:
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user@example.com",
    "credential_id": "cred_user@example.com_1729526400000_abc123xyz",
    "public_key": "raw_user@example.com_1729526400000_abc123xyz",
    "provider": "Apple",
    "created_at": "2025-10-21T10:00:00Z",
    "last_used_at": null
  }

Login Example:
Input:
  userID = "user@example.com"
  assertion = { id: "cred_user@example.com_1729526400000_abc123xyz" }

Verification:
  1. Fetch passkeys for user@example.com
  2. Check if credential_id matches
  3. Return authenticated: true
  4. Update last_used_at timestamp
```

## API Request/Response Examples

```
┌──────────────────────────────────────────────────────────────┐
│                  REGISTRATION REQUEST                         │
└──────────────────────────────────────────────────────────────┘

POST https://dsw2b-backend.onrender.com/register
Content-Type: application/json

{
  "userID": "user@example.com",
  "provider": "Apple"
}

Response (200 OK):
{
  "message": "Passkey registered successfully",
  "userId": "user@example.com",
  "credentialId": "cred_user@example.com_1729526400000_abc123xyz",
  "passkey": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user@example.com",
    "credential_id": "cred_user@example.com_1729526400000_abc123xyz",
    "public_key": "raw_user@example.com_1729526400000_abc123xyz",
    "provider": "Apple",
    "created_at": "2025-10-21T10:00:00Z"
  }
}

┌──────────────────────────────────────────────────────────────┐
│                    LOGIN REQUEST                              │
└──────────────────────────────────────────────────────────────┘

POST https://dsw2b-backend.onrender.com/login/verify
Content-Type: application/json

{
  "userID": "user@example.com",
  "assertion": {
    "id": "cred_user@example.com_1729526400000_abc123xyz",
    "type": "public-key"
  }
}

Response (200 OK):
{
  "message": "Login verified successfully",
  "userId": "user@example.com",
  "authenticated": true
}
```
