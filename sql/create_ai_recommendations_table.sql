-- Create ai_recommendations table for caching Perplexity AI analysis
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  track_name TEXT,
  context TEXT NOT NULL DEFAULT 'full_discovery',
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(artist_name, track_name, context)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_artist ON ai_recommendations(artist_name);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_track ON ai_recommendations(track_name);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_context ON ai_recommendations(context);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON ai_recommendations(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_recommendations_updated_at
    BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a test record to verify the table works
INSERT INTO ai_recommendations (artist_name, track_name, context, recommendations)
VALUES (
  'Test Artist',
  'Test Track',
  'test',
  jsonb_build_object('test', true, 'created_at', NOW())
);

-- Clean up test record
DELETE FROM ai_recommendations WHERE context = 'test';

-- Verify table is working
SELECT 'ai_recommendations table created successfully' as status;