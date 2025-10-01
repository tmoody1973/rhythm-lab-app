-- Add YouTube caching columns to mixcloud_tracks table
ALTER TABLE mixcloud_tracks
ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS youtube_thumbnail VARCHAR(500),
ADD COLUMN IF NOT EXISTS youtube_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS youtube_channel VARCHAR(255),
ADD COLUMN IF NOT EXISTS youtube_duration VARCHAR(50),
ADD COLUMN IF NOT EXISTS youtube_view_count INTEGER,
ADD COLUMN IF NOT EXISTS youtube_cached_at TIMESTAMPTZ;

-- Add YouTube caching columns to songs table (for live tracks)
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS youtube_thumbnail VARCHAR(500),
ADD COLUMN IF NOT EXISTS youtube_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS youtube_channel VARCHAR(255),
ADD COLUMN IF NOT EXISTS youtube_duration VARCHAR(50),
ADD COLUMN IF NOT EXISTS youtube_view_count INTEGER,
ADD COLUMN IF NOT EXISTS youtube_cached_at TIMESTAMPTZ;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_mixcloud_tracks_youtube_cached
ON mixcloud_tracks(youtube_cached_at)
WHERE youtube_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_songs_youtube_cached
ON songs(youtube_cached_at)
WHERE youtube_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN mixcloud_tracks.youtube_video_id IS 'YouTube video ID for caching - avoids API rate limits';
COMMENT ON COLUMN mixcloud_tracks.youtube_cached_at IS 'Timestamp when YouTube data was last cached';
COMMENT ON COLUMN songs.youtube_video_id IS 'YouTube video ID for caching - avoids API rate limits';
COMMENT ON COLUMN songs.youtube_cached_at IS 'Timestamp when YouTube data was last cached';
