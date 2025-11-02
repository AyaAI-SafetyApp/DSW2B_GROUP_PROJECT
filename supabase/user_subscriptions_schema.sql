-- Create user_subscriptions table for storing subscription information
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add constraint to ensure valid subscription tiers
  CONSTRAINT valid_subscription_tier CHECK (
    subscription_tier IN ('free', 'personal', 'family', 'personal_pro')
  )
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_email ON user_subscriptions(email);

-- Create index on is_active for filtering active subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(is_active);

-- Add Row Level Security (RLS) policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Policy: Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Policy: Users can update their own subscription
CREATE POLICY "Users can update own subscription"
  ON user_subscriptions
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access"
  ON user_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default free subscriptions for existing users (optional)
-- This will give all existing users a free subscription if they don't have one
INSERT INTO user_subscriptions (email, subscription_tier, is_active)
SELECT DISTINCT email, 'free', true
FROM user_profiles
WHERE email NOT IN (SELECT email FROM user_subscriptions)
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE user_subscriptions IS 'Stores user subscription information and tier levels';
COMMENT ON COLUMN user_subscriptions.email IS 'User email address (unique identifier)';
COMMENT ON COLUMN user_subscriptions.subscription_tier IS 'Subscription tier: free, personal, family, or personal_pro';
COMMENT ON COLUMN user_subscriptions.expires_at IS 'Subscription expiration date (NULL for free tier)';
COMMENT ON COLUMN user_subscriptions.is_active IS 'Whether the subscription is currently active';
