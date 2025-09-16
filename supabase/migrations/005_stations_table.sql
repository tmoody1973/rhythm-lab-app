-- Simple station configuration for Rhythm Lab Radio
-- Just stores the basic config needed for Spinitron API

CREATE TABLE IF NOT EXISTS station_config (
  id INTEGER PRIMARY KEY DEFAULT 1,      -- Only one row needed
  station_name TEXT NOT NULL DEFAULT 'Rhythm Lab Radio',
  station_id TEXT NOT NULL DEFAULT 'rlr-main',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  spinitron_base_url TEXT NOT NULL DEFAULT 'https://spinitron.com/api',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one configuration row
  CONSTRAINT single_config CHECK (id = 1)
);

-- Insert the single station configuration
INSERT INTO station_config (station_name, station_id, timezone)
VALUES (
  'Rhythm Lab Radio',
  'rlr-main',
  'America/New_York'
) ON CONFLICT (id) DO UPDATE SET
  station_name = EXCLUDED.station_name,
  station_id = EXCLUDED.station_id,
  timezone = EXCLUDED.timezone,
  updated_at = NOW();

-- Enable RLS (Row Level Security)
ALTER TABLE station_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read station config (needed for edge function)
CREATE POLICY "Allow read access to station config" ON station_config
  FOR SELECT USING (true);

-- Only authenticated users can modify config
CREATE POLICY "Allow authenticated users to modify config" ON station_config
  FOR ALL USING (auth.role() = 'authenticated');

-- Add helpful comment
COMMENT ON TABLE station_config IS 'Single station configuration for Rhythm Lab Radio';