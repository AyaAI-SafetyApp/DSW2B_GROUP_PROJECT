-- Create training_sessions table to store AR training data
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  training_type TEXT NOT NULL, -- 'defense', 'fall', 'reaction'
  training_title TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  reps_completed INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  accuracy_percentage INTEGER DEFAULT 0,
  perfect_moves INTEGER DEFAULT 0,
  good_moves INTEGER DEFAULT 0,
  movements_data JSONB, -- Stores detailed movement data (accelerometer, gyroscope readings)
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_email ON training_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_training_sessions_training_type ON training_sessions(training_type);
CREATE INDEX IF NOT EXISTS idx_training_sessions_completed_at ON training_sessions(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own training sessions
CREATE POLICY "Users can view their own training sessions"
  ON training_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own training sessions
CREATE POLICY "Users can insert their own training sessions"
  ON training_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own training sessions
CREATE POLICY "Users can update their own training sessions"
  ON training_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own training sessions
CREATE POLICY "Users can delete their own training sessions"
  ON training_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a view for training statistics
CREATE OR REPLACE VIEW training_stats AS
SELECT 
  user_id,
  user_email,
  training_type,
  COUNT(*) as total_sessions,
  SUM(score) as total_score,
  AVG(score) as avg_score,
  SUM(reps_completed) as total_reps,
  AVG(accuracy_percentage) as avg_accuracy,
  SUM(perfect_moves) as total_perfect_moves,
  SUM(duration_seconds) as total_duration_seconds,
  MAX(completed_at) as last_training_date
FROM training_sessions
GROUP BY user_id, user_email, training_type;

-- Grant access to the view
GRANT SELECT ON training_stats TO authenticated;
