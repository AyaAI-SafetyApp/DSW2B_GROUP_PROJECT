# Passkey System Testing Guide

## Pre-Testing Checklist

- [ ] Supabase migration has been run (`supabase_passkeys_migration.sql`)
- [ ] Backend server is running (`node Backend/server.js`)
- [ ] React Native app is running (`npm start` in AyaApp)
- [ ] Device/emulator has biometric authentication enabled
- [ ] Backend URL is correctly configured in app

## Test Cases

### 1. Database Setup Verification

**Objective:** Verify Supabase database is correctly configured

**Steps:**
1. Go to Supabase Dashboard: https://app.supabase.com
2. Select project: `gfrnxqhivmgfgdersflu`
3. Navigate to "Table Editor"
4. Look for `passkeys` table

**Expected Result:**
✓ Table exists with columns: id, user_id, credential_id, public_key, provider, created_at, last_used_at
✓ Indexes exist: idx_passkeys_user_id, idx_passkeys_credential_id
✓ RLS is enabled

**Status:** [ ] Pass [ ] Fail

---

### 2. Backend API Health Check

**Objective:** Verify backend server is running and accessible

**Test A: Server Status**
```bash
curl http://localhost:3001/
# or
curl https://dsw2b-backend.onrender.com/
```

**Expected Result:**
✓ Server responds (any response, doesn't matter the content)

**Test B: Passkey Service Import**
Check server logs for errors related to passkeyService import

**Expected Result:**
✓ No import errors
✓ Server starts successfully

**Status:** [ ] Pass [ ] Fail

---

### 3. Registration Flow - Happy Path

**Objective:** Test successful passkey registration

**Steps:**
1. Open mobile app
2. Navigate to CreateCredential screen
3. Enter email: `test@example.com`
4. Click "Continue with Apple"
5. Authenticate with biometrics (or use device fallback)
6. Wait for success animation
7. Verify navigation to AccountForm

**Expected Result:**
✓ Biometric prompt appears
✓ Success animation shows
✓ Navigates to AccountForm
✓ No error messages

**Verify in Supabase:**
1. Go to Table Editor → passkeys
2. Look for entry with user_id = `test@example.com`

**Expected Database Entry:**
```
user_id: test@example.com
credential_id: cred_test@example.com_[timestamp]_[random]
public_key: raw_test@example.com_[timestamp]_[random]
provider: Apple
created_at: [current timestamp]
```

**Status:** [ ] Pass [ ] Fail

---

### 4. Registration Flow - Error Cases

**Test A: Empty Email**
1. Navigate to CreateCredential
2. Leave email field empty
3. Click "Continue with Apple"

**Expected Result:**
✓ Shows error: "Enter email or phone"
✓ Does not proceed to biometric

**Status:** [ ] Pass [ ] Fail

**Test B: Biometric Failure**
1. Enter email: `test2@example.com`
2. Click "Continue with Apple"
3. Cancel biometric authentication

**Expected Result:**
✓ Shows error: "Biometric authentication failed"
✓ Does not create passkey

**Status:** [ ] Pass [ ] Fail

**Test C: Network Error**
1. Disconnect from internet
2. Enter email: `test3@example.com`
3. Click "Continue with Apple"
4. Complete biometric auth

**Expected Result:**
✓ Shows network error message
✓ Does not navigate away

**Status:** [ ] Pass [ ] Fail

---

### 5. Login Flow - Happy Path

**Objective:** Test successful login with existing passkey

**Prerequisites:**
- User must have registered (Test Case 3)

**Steps:**
1. Navigate to GetAssertion screen
2. Ensure userID is set to `test@example.com` (via navigation params)
3. Click "Authenticate"
4. Complete biometric authentication
5. Wait for verification

**Expected Result:**
✓ Biometric prompt appears
✓ Shows "Verifying passkey..." status
✓ Shows "Login successful!" message
✓ Navigates to MainTabs

**Verify API Calls:**
Check network tab or console logs for:
1. `GET /api/passkey/test@example.com` - Should return passkeys array
2. `POST /login/verify` - Should return authenticated: true

**Status:** [ ] Pass [ ] Fail

---

### 6. Login Flow - Error Cases

**Test A: No Passkeys**
1. Navigate to GetAssertion
2. Set userID to `nonexistent@example.com`
3. Click "Authenticate"
4. Complete biometric auth

**Expected Result:**
✓ Shows "No passkey found. Please register first."
✓ Does not navigate

**Status:** [ ] Pass [ ] Fail

**Test B: Biometric Not Available**
1. Test on device without biometric (or disable biometrics)
2. Click "Authenticate"

**Expected Result:**
✓ Shows "Biometric not available"
✓ Does not proceed

**Status:** [ ] Pass [ ] Fail

**Test C: Invalid Credential**
1. Manually send POST to /login/verify with invalid credential_id
```bash
curl -X POST http://localhost:3001/login/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "test@example.com",
    "assertion": {"id": "invalid-credential-id"}
  }'
```

**Expected Result:**
✓ Returns 401 status
✓ Error: "Invalid passkey credential"

**Status:** [ ] Pass [ ] Fail

---

### 7. API Endpoint Tests

**Test A: POST /register**
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "api-test@example.com",
    "provider": "Google"
  }'
```

**Expected Response:**
```json
{
  "message": "Passkey registered successfully",
  "userId": "api-test@example.com",
  "credentialId": "cred_api-test@example.com_...",
  "passkey": { ... }
}
```

**Status:** [ ] Pass [ ] Fail

**Test B: GET /api/passkey/:userId**
```bash
curl http://localhost:3001/api/passkey/test@example.com
```

**Expected Response:**
```json
{
  "passkeys": [
    {
      "id": "uuid",
      "user_id": "test@example.com",
      "credential_id": "cred_...",
      ...
    }
  ],
  "count": 1
}
```

**Status:** [ ] Pass [ ] Fail

**Test C: POST /login/verify**
```bash
# First get the credential_id from previous test
curl -X POST http://localhost:3001/login/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "test@example.com",
    "assertion": {
      "id": "cred_test@example.com_...",
      "type": "public-key"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Login verified successfully",
  "userId": "test@example.com",
  "authenticated": true
}
```

**Status:** [ ] Pass [ ] Fail

---

### 8. Database Integrity Tests

**Test A: Unique Constraint**
1. Register user: `unique-test@example.com`
2. Get the credential_id from Supabase
3. Try to insert duplicate credential_id manually in SQL Editor

**Expected Result:**
✓ Insertion fails with unique constraint error

**Status:** [ ] Pass [ ] Fail

**Test B: Row Level Security**
1. Create a test user in Supabase Auth
2. Try to query passkeys without proper authentication
3. Try to insert passkey for another user

**Expected Result:**
✓ Can only access own passkeys
✓ Cannot modify other users' passkeys

**Status:** [ ] Pass [ ] Fail

---

### 9. Multi-User Test

**Objective:** Verify multiple users can register and login

**Steps:**
1. Register user1: `user1@example.com` with Apple
2. Register user2: `user2@example.com` with Google
3. Login as user1
4. Logout and login as user2

**Expected Result:**
✓ Both users registered successfully
✓ Both can login with their own passkeys
✓ Passkeys are isolated per user

**Verify in Database:**
- Two separate entries in passkeys table
- Different credential_ids
- Correct user_id and provider for each

**Status:** [ ] Pass [ ] Fail

---

### 10. Performance Test

**Objective:** Verify system handles multiple operations efficiently

**Test A: Registration Speed**
- Register 5 users in succession
- Measure time for each

**Expected Result:**
✓ Each registration completes in < 3 seconds
✓ No timeouts or errors

**Status:** [ ] Pass [ ] Fail

**Test B: Login Speed**
- Login 5 times with the same user
- Measure time for each

**Expected Result:**
✓ Each login completes in < 2 seconds
✓ Consistent performance

**Status:** [ ] Pass [ ] Fail

---

## Integration Test Checklist

- [ ] User can register with Apple provider
- [ ] User can register with Google provider
- [ ] Passkey is stored in Supabase
- [ ] User can login with registered passkey
- [ ] Multiple users can have separate passkeys
- [ ] Error messages are clear and helpful
- [ ] Biometric authentication works
- [ ] Network errors are handled gracefully
- [ ] Database constraints are enforced
- [ ] RLS policies protect user data

## Security Test Checklist

- [ ] Biometric authentication is required
- [ ] Passkeys are unique per user
- [ ] Users cannot access other users' passkeys
- [ ] Credential IDs are sufficiently random
- [ ] HTTPS is used for all API calls
- [ ] No sensitive data in logs
- [ ] Row Level Security is active
- [ ] Invalid credentials are rejected

## Bug Reporting Template

If a test fails, use this template:

```
Test Case: [Test number and name]
Expected: [What should happen]
Actual: [What actually happened]
Steps to Reproduce:
1.
2.
3.

Environment:
- Device: [iOS/Android/Emulator]
- App Version:
- Backend URL:
- Supabase Project: gfrnxqhivmgfgdersflu

Error Messages:
[Paste any error messages]

Screenshots:
[Attach if applicable]
```

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Database Setup | [ ] | |
| 2. Backend Health | [ ] | |
| 3. Registration Happy Path | [ ] | |
| 4. Registration Errors | [ ] | |
| 5. Login Happy Path | [ ] | |
| 6. Login Errors | [ ] | |
| 7. API Endpoints | [ ] | |
| 8. Database Integrity | [ ] | |
| 9. Multi-User | [ ] | |
| 10. Performance | [ ] | |

**Overall Status:** [ ] All Pass [ ] Some Failures

**Tested By:** _____________
**Date:** _____________
**Notes:**
