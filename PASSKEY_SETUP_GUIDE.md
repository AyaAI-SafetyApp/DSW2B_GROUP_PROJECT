# Quick Setup Guide: Supabase Passkey System

## Step 1: Run Database Migration

### Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project: `gfrnxqhivmgfgdersflu`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Execute Migration**
   - Open the file: `Backend/supabase_passkeys_migration.sql`
   - Copy ALL the SQL code
   - Paste it into the SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

4. **Verify Table Creation**
   - Go to "Table Editor" in sidebar
   - Look for `passkeys` table
   - You should see columns: id, user_id, credential_id, public_key, provider, created_at, last_used_at

### Via Supabase CLI (Alternative)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref gfrnxqhivmgfgdersflu

# Run migration
supabase db push --db-url "your-database-url"
```

## Step 2: Verify Backend Configuration

The backend is already configured with your Supabase credentials:

**File:** `Backend/passkeyService.js`
```javascript
const SUPABASE_URL = "https://gfrnxqhivmgfgdersflu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGci...";
```

## Step 3: Test the System

### Test Registration

1. Start the backend server:
   ```bash
   cd Backend
   node server.js
   ```

2. Start the React Native app:
   ```bash
   cd AyaApp
   npm start
   ```

3. Navigate to CreateCredential screen
4. Enter email/phone
5. Click "Continue with Apple" or "Continue with Google"
6. Complete biometric authentication

### Test Login

1. Navigate to GetAssertion screen
2. Click "Authenticate"
3. Complete biometric authentication
4. Should navigate to main app

## Step 4: Verify Data in Supabase

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select `passkeys` table
4. You should see your test passkey entries

## API Endpoints

Once setup is complete, these endpoints will be available:

- `POST /register` - Register new passkey
- `POST /login/verify` - Verify login with passkey
- `GET /api/passkey/:userId` - Get user's passkeys

## Troubleshooting

### Migration fails
- Check you're connected to the correct project
- Ensure you have admin permissions
- Try running each CREATE statement separately

### Can't connect to Supabase
- Verify project URL and anon key are correct
- Check network connectivity
- Verify RLS policies are properly set

### Biometric authentication not working
- Test on physical device (emulators may not support biometrics)
- Ensure device has fingerprint/face ID enabled
- Check permissions in app.json

## Configuration Files Updated

✅ `Backend/passkeyService.js` - Supabase client setup
✅ `Backend/server.js` - API endpoints
✅ `AyaApp/screens/Auth/CreateCredential.js` - Registration UI
✅ `AyaApp/screens/Auth/GetAssertion.js` - Login UI
✅ `AyaApp/lib/supabaseClient.js` - Already configured

## Next Steps

1. ✅ Run the migration SQL
2. ✅ Test registration flow
3. ✅ Test login flow
4. Deploy to production
5. Test on physical devices

## Production Checklist

- [ ] Run migration in production Supabase
- [ ] Update backend URL in CreateCredential.js and GetAssertion.js
- [ ] Test with real biometric devices
- [ ] Monitor Supabase logs for errors
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Add rate limiting to prevent abuse
- [ ] Implement passkey expiration/refresh logic
- [ ] Add multi-device support

## Support

For detailed documentation, see: `PASSKEY_SUPABASE_README.md`
