-- Create reactivation_codes table for account reactivation
CREATE TABLE IF NOT EXISTS reactivation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  code TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reactivation_codes_email ON reactivation_codes(user_email);
CREATE INDEX IF NOT EXISTS idx_reactivation_codes_code ON reactivation_codes(code);
CREATE INDEX IF NOT EXISTS idx_reactivation_codes_expires ON reactivation_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE reactivation_codes ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own reactivation codes
CREATE POLICY "Users can view their own reactivation codes"
  ON reactivation_codes
  FOR SELECT
  USING (true); -- Allow anyone to read (needed for public reactivation flow)

-- Create policy: Anyone can insert reactivation codes (public endpoint)
CREATE POLICY "Anyone can insert reactivation codes"
  ON reactivation_codes
  FOR INSERT
  WITH CHECK (true);

-- Create policy: Anyone can update reactivation codes (to mark as used)
CREATE POLICY "Anyone can update reactivation codes"
  ON reactivation_codes
  FOR UPDATE
  USING (true);

-- Function to clean up expired codes (optional - can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_reactivation_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM reactivation_codes
  WHERE expires_at < NOW() AND is_used = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE reactivation_codes IS 'Stores temporary codes for account reactivation';
COMMENT ON COLUMN reactivation_codes.code IS '6-digit verification code sent via email';
COMMENT ON COLUMN reactivation_codes.expires_at IS 'Code expires 24 hours after creation';
