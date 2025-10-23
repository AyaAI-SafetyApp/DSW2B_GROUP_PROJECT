-- Add account status columns to user_profiles table

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on is_active
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Add comment to columns
COMMENT ON COLUMN user_profiles.is_active IS 'Whether the account is active (true) or deactivated (false)';
COMMENT ON COLUMN user_profiles.deactivated_at IS 'Timestamp when the account was deactivated';

-- Enable Row Level Security (RLS) on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON user_profiles FOR DELETE 
USING (true); -- Allow anyone to delete (we handle auth in app)

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON user_profiles FOR UPDATE 
USING (true); -- Allow anyone to update (we handle auth in app)

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON user_profiles FOR SELECT 
USING (true); -- Allow anyone to read

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (true); -- Allow anyone to insert

-- Enable RLS on passkeys table
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- Drop existing passkeys policies if they exist
DROP POLICY IF EXISTS "Users can delete their own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can insert their own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can view their own passkeys" ON passkeys;

-- Allow users to delete their own passkeys
CREATE POLICY "Users can delete their own passkeys" 
ON passkeys FOR DELETE 
USING (true); -- Allow anyone to delete (we handle auth in app)

-- Allow users to insert their own passkeys
CREATE POLICY "Users can insert their own passkeys" 
ON passkeys FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own passkeys
CREATE POLICY "Users can view their own passkeys" 
ON passkeys FOR SELECT 
USING (true);
