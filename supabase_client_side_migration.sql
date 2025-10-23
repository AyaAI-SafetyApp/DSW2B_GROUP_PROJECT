-- =====================================================
-- Supabase Passkeys Table - Client-Side Implementation
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This allows the React Native app to communicate
-- directly with Supabase without a backend server
-- =====================================================

-- Create passkeys table
CREATE TABLE IF NOT EXISTS passkeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    provider TEXT DEFAULT 'biometric',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure user_id + credential_id combination is unique
    CONSTRAINT passkeys_user_id_credential_id_key UNIQUE (user_id, credential_id)
);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Index for faster user lookup
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id 
ON passkeys(user_id);

-- Index for faster credential verification during login
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id 
ON passkeys(credential_id);

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_passkeys_created_at 
ON passkeys(created_at DESC);

-- =====================================================
-- Enable Row Level Security
-- =====================================================

ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create RLS Policies
-- =====================================================

-- Policy 1: Allow anonymous users to view passkeys
-- (Needed for unauthenticated login verification)
CREATE POLICY "Allow anonymous read access to passkeys"
    ON passkeys
    FOR SELECT
    USING (true);

-- Policy 2: Allow anonymous users to insert passkeys
-- (Needed for registration without authentication)
CREATE POLICY "Allow anonymous insert access to passkeys"
    ON passkeys
    FOR INSERT
    WITH CHECK (true);

-- Policy 3: Allow anonymous users to update passkeys
-- (Needed for updating last_used_at timestamp)
CREATE POLICY "Allow anonymous update access to passkeys"
    ON passkeys
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow anonymous users to delete passkeys
-- (Optional - for passkey management)
CREATE POLICY "Allow anonymous delete access to passkeys"
    ON passkeys
    FOR DELETE
    USING (true);

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant all permissions to anon role (for client-side access)
GRANT SELECT, INSERT, UPDATE, DELETE ON passkeys TO anon;

-- Grant all permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON passkeys TO authenticated;

-- =====================================================
-- Optional: Create Function to Clean Old Passkeys
-- =====================================================

-- Function to delete passkeys older than 90 days that haven't been used
CREATE OR REPLACE FUNCTION cleanup_old_passkeys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM passkeys
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Optional: Add Table Comments
-- =====================================================

COMMENT ON TABLE passkeys IS 'Stores user passkey credentials for biometric authentication. Direct client-side access enabled.';
COMMENT ON COLUMN passkeys.id IS 'Unique identifier for the passkey record';
COMMENT ON COLUMN passkeys.user_id IS 'User email or phone number';
COMMENT ON COLUMN passkeys.credential_id IS 'Unique passkey credential identifier';
COMMENT ON COLUMN passkeys.public_key IS 'Public key associated with the passkey';
COMMENT ON COLUMN passkeys.provider IS 'Authentication provider (Apple, Google, biometric)';
COMMENT ON COLUMN passkeys.created_at IS 'Timestamp when passkey was created';
COMMENT ON COLUMN passkeys.last_used_at IS 'Timestamp when passkey was last used for login';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Run these to verify the table was created correctly:

-- Check table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'passkeys'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'passkeys';

-- Check RLS policies
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'passkeys';

-- =====================================================
-- Test Data (Optional - for testing)
-- =====================================================

-- Uncomment to insert test data:
-- INSERT INTO passkeys (user_id, credential_id, public_key, provider)
-- VALUES ('test@example.com', 'cred_test_1729700000000_abc123', 'key_test_1729700000000_abc123', 'Apple');

-- =====================================================
-- Migration Complete!
-- =====================================================
-- 
-- What was created:
-- ✅ passkeys table with all required columns
-- ✅ Indexes for fast lookups
-- ✅ Row Level Security enabled
-- ✅ Policies for anonymous access
-- ✅ Permissions for anon and authenticated roles
-- 
-- Your React Native app can now:
-- ✅ Insert passkeys directly (registration)
-- ✅ Query passkeys directly (login)
-- ✅ Update last_used_at timestamp
-- ✅ Delete passkeys (optional)
-- 
-- No backend server modifications needed!
-- =====================================================
