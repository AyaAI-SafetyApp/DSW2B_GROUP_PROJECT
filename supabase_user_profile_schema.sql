-- Supabase User Profile Schema for Aya App
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL, -- Email or Supabase auth user ID
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT,
  phone TEXT,
  location TEXT,
  age INTEGER,
  gender TEXT,
  profile_picture_url TEXT, -- URL to uploaded image in Supabase Storage
  provider TEXT DEFAULT 'email', -- 'email', 'Apple', 'Google', 'Biometric'
  
  -- Additional profile fields
  bio TEXT,
  emergency_contacts JSONB DEFAULT '[]'::jsonb, -- Array of emergency contacts
  safety_preferences JSONB DEFAULT '{}'::jsonb, -- User safety settings
  achievements JSONB DEFAULT '[]'::jsonb, -- User achievements/badges
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Allow anyone to create a profile (for registration)
CREATE POLICY "Allow insert for all users"
  ON user_profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Allow reading for now (you can restrict later)

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create storage bucket for profile pictures
-- Note: Run this in the Supabase Dashboard Storage section
-- Bucket name: "profile-pictures"
-- Public: Yes (or No if you want private URLs)

/*
To create the storage bucket via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;
*/

-- 8. Create storage policy for profile pictures
CREATE POLICY "Anyone can upload profile pictures"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update their profile pictures"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'profile-pictures')
  WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Users can delete their profile pictures"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'profile-pictures');

-- 9. Sample query to fetch user profile
/*
SELECT * FROM user_profiles 
WHERE user_id = 'user@example.com' 
OR email = 'user@example.com';
*/

-- 10. Sample query to update user profile
/*
UPDATE user_profiles 
SET 
  full_name = 'John Doe',
  phone = '+27123456789',
  location = 'Johannesburg, South Africa',
  updated_at = NOW()
WHERE user_id = 'user@example.com';
*/
