-- Create table for time-based safety tips
CREATE TABLE IF NOT EXISTS time_based_safety_tips (
  id SERIAL PRIMARY KEY,
  time_range TEXT NOT NULL,
  hour_start INTEGER NOT NULL,
  hour_end INTEGER NOT NULL,
  awareness TEXT NOT NULL,
  tip TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add unique constraint to prevent duplicate time ranges
ALTER TABLE time_based_safety_tips 
ADD CONSTRAINT unique_time_range UNIQUE (time_range);

-- Create index for faster queries based on time
CREATE INDEX idx_time_range ON time_based_safety_tips(hour_start, hour_end);

-- Insert initial data (will be done by the backend automatically, but you can also run this manually)
-- INSERT INTO time_based_safety_tips (time_range, hour_start, hour_end, awareness, tip, icon) VALUES
-- ('00:00–06:00', 0, 6, 'Break-ins, night theft', 'Lock everything and avoid late-night movement.', 'moon'),
-- ('06:00–12:00', 6, 12, 'Phone snatching, muggings', 'Stay alert on commute; keep valuables hidden.', 'sunny-outline'),
-- ('12:00–18:00', 12, 18, 'Burglaries, car theft', 'Lock your home and car; don''t leave items visible.', 'partly-sunny'),
-- ('18:00–24:00', 18, 24, 'Hijackings, robberies', 'Stay alert when driving; avoid dark, quiet areas.', 'moon-outline');
