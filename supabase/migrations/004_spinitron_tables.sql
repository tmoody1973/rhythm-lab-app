-- Add stations table (required for songs foreign key)
CREATE TABLE public.stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Spinitron songs table
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  spinitron_id INTEGER NOT NULL,
  song TEXT NOT NULL,
  artist TEXT NOT NULL,
  release TEXT NULL,
  label TEXT NULL,
  image TEXT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NULL,
  episode_title TEXT NULL,
  station_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  added_by_user_id UUID NULL,
  manual_added_at TIMESTAMP WITH TIME ZONE NULL,
  spotify_track_id TEXT NULL,
  spotify_artist_id TEXT NULL,
  spotify_album_id TEXT NULL,
  enhanced_metadata JSONB NULL,
  CONSTRAINT songs_pkey PRIMARY KEY (id),
  CONSTRAINT songs_spinitron_id_key UNIQUE (spinitron_id),
  CONSTRAINT fk_songs_station FOREIGN KEY (station_id) REFERENCES public.stations (id),
  CONSTRAINT songs_added_by_user_id_fkey FOREIGN KEY (added_by_user_id) REFERENCES auth.users (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_artist ON public.songs USING gin (to_tsvector('english'::regconfig, artist));

CREATE INDEX IF NOT EXISTS idx_songs_song ON public.songs USING gin (to_tsvector('english'::regconfig, song));

CREATE INDEX IF NOT EXISTS idx_songs_release ON public.songs USING gin (to_tsvector('english'::regconfig, release));

CREATE INDEX IF NOT EXISTS idx_songs_start_time ON public.songs USING btree (start_time DESC);

CREATE INDEX IF NOT EXISTS idx_songs_station_id ON public.songs USING btree (station_id);

CREATE INDEX IF NOT EXISTS idx_songs_station_start_time ON public.songs USING btree (station_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_songs_is_manual ON public.songs USING btree (is_manual);

CREATE INDEX IF NOT EXISTS idx_songs_manual_added_at ON public.songs USING btree (manual_added_at);

-- Add updated_at trigger for stations
CREATE TRIGGER stations_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger for songs
CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default station for Rhythm Lab Radio
INSERT INTO public.stations (id, name, description, timezone) VALUES
('rlr-main', 'Rhythm Lab Radio', 'Main Rhythm Lab Radio station', 'America/New_York');

-- Create is_admin function if it doesn't exist (in case migration 002 wasn't run)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in profiles table
  -- You can implement this based on your admin system
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND (email LIKE '%@rhythmlabradio.com' OR email = 'admin@example.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- RLS policies for stations (read-only for users)
CREATE POLICY "Stations are viewable by everyone"
  ON public.stations FOR SELECT
  USING (true);

-- Admin policies for stations
CREATE POLICY "Admins can manage stations"
  ON public.stations FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS policies for songs (read-only for users, except manual additions)
CREATE POLICY "Songs are viewable by everyone"
  ON public.songs FOR SELECT
  USING (true);

CREATE POLICY "Users can add manual songs"
  ON public.songs FOR INSERT
  WITH CHECK (is_manual = true AND auth.uid() = added_by_user_id);

CREATE POLICY "Users can update their manual songs"
  ON public.songs FOR UPDATE
  USING (is_manual = true AND auth.uid() = added_by_user_id);

CREATE POLICY "Users can delete their manual songs"
  ON public.songs FOR DELETE
  USING (is_manual = true AND auth.uid() = added_by_user_id);

-- Admin policies for songs (can manage all songs)
CREATE POLICY "Admins can manage all songs"
  ON public.songs FOR ALL
  USING (public.is_admin(auth.uid()));

-- Update user_favorites to include songs
ALTER TABLE public.user_favorites DROP CONSTRAINT user_favorites_item_type_check;
ALTER TABLE public.user_favorites ADD CONSTRAINT user_favorites_item_type_check
  CHECK (item_type IN ('show', 'track', 'song', 'blog_post', 'artist_profile', 'deep_dive'));