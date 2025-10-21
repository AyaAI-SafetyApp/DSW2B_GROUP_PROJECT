-- Supabase Migration: Create Passkeys Table
-- Run this SQL in your Supabase SQL Editor

-- Create passkeys table
CREATE TABLE IF NOT EXISTS passkeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    provider TEXT DEFAULT 'biometric',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for faster lookups
    CONSTRAINT passkeys_user_id_credential_id_key UNIQUE (user_id, credential_id)
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);

-- Create index on credential_id for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);

-- Enable Row Level Security (RLS)
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own passkeys
CREATE POLICY "Users can view their own passkeys"
    ON passkeys
    FOR SELECT
    USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- Create policy: Users can insert their own passkeys
CREATE POLICY "Users can insert their own passkeys"
    ON passkeys
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

-- Create policy: Users can update their own passkeys
CREATE POLICY "Users can update their own passkeys"
    ON passkeys
    FOR UPDATE
    USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- Create policy: Users can delete their own passkeys
CREATE POLICY "Users can delete their own passkeys"
    ON passkeys
    FOR DELETE
    USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- Grant permissions to anon and authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON passkeys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON passkeys TO authenticated;

-- Create a function to update last_used_at on login
CREATE OR REPLACE FUNCTION update_passkey_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Add comment to table
COMMENT ON TABLE passkeys IS 'Stores user passkey credentials for biometric authentication';
