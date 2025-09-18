-- Mixcloud Importer Database Schema
-- Run this in Supabase SQL Editor or save as migration

-- Create shows table for Mixcloud show metadata
CREATE TABLE shows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    mixcloud_url VARCHAR(500) UNIQUE NOT NULL,
    mixcloud_embed TEXT, -- HTML embed code from Mixcloud
    mixcloud_picture VARCHAR(500), -- Cover image URL
    publish_date TIMESTAMPTZ NOT NULL,
    storyblok_id VARCHAR(50), -- Reference to Storyblok story ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mixcloud_tracks table for playlist data
CREATE TABLE mixcloud_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- Global position in show (1, 2, 3...)
    hour INTEGER, -- Which hour of the show (1, 2, 3... or NULL)
    artist VARCHAR(255) NOT NULL,
    track VARCHAR(255) NOT NULL,
    spotify_url VARCHAR(500), -- Enriched Spotify link
    youtube_url VARCHAR(500), -- Enriched YouTube link
    discogs_url VARCHAR(500), -- Enriched Discogs link
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure position is unique within each show
    UNIQUE(show_id, position)
);

-- Create indexes for better query performance
CREATE INDEX idx_shows_slug ON shows(slug);
CREATE INDEX idx_shows_publish_date ON shows(publish_date DESC);
CREATE INDEX idx_shows_mixcloud_url ON shows(mixcloud_url);
CREATE INDEX idx_shows_storyblok_id ON shows(storyblok_id);

CREATE INDEX idx_mixcloud_tracks_show_id ON mixcloud_tracks(show_id);
CREATE INDEX idx_mixcloud_tracks_position ON mixcloud_tracks(show_id, position);
CREATE INDEX idx_mixcloud_tracks_hour ON mixcloud_tracks(show_id, hour);
CREATE INDEX idx_mixcloud_tracks_artist ON mixcloud_tracks(artist);
CREATE INDEX idx_mixcloud_tracks_enrichment ON mixcloud_tracks(spotify_url, youtube_url, discogs_url);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at timestamp
CREATE TRIGGER update_shows_updated_at
    BEFORE UPDATE ON shows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mixcloud_tracks_updated_at
    BEFORE UPDATE ON mixcloud_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies for admin-only access
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mixcloud_tracks ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read shows (for public display)
CREATE POLICY "Shows are viewable by everyone" ON shows
    FOR SELECT USING (true);

-- Profiles table with role column already exists
-- Using existing profiles table for admin authentication

-- Policy: Only admin users can insert/update/delete shows
CREATE POLICY "Shows are manageable by admins only" ON shows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Only authenticated users can read mixcloud_tracks (for public display)
CREATE POLICY "Mixcloud tracks are viewable by everyone" ON mixcloud_tracks
    FOR SELECT USING (true);

-- Policy: Only admin users can insert/update/delete mixcloud_tracks
CREATE POLICY "Mixcloud tracks are manageable by admins only" ON mixcloud_tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Sample data for testing (optional)
INSERT INTO shows (title, slug, description, mixcloud_url, mixcloud_embed, mixcloud_picture, publish_date) VALUES
(
    'Test Radio Show #1',
    'test-radio-show-1',
    'A sample radio show for testing the Mixcloud importer',
    'https://www.mixcloud.com/rhythmlab/test-show-1/',
    '<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Frhythmlab%2Ftest-show-1%2F" frameborder="0"></iframe>',
    'https://thumbnailer.mixcloud.com/unsafe/600x600/extaudio/4/c/8/2/test-image.jpg',
    '2025-09-17T20:00:00Z'
);

-- Add some sample mixcloud_tracks
INSERT INTO mixcloud_tracks (show_id, position, hour, artist, track) VALUES
(
    (SELECT id FROM shows WHERE slug = 'test-radio-show-1'),
    1,
    1,
    'Artist One',
    'Track Title One'
),
(
    (SELECT id FROM shows WHERE slug = 'test-radio-show-1'),
    2,
    1,
    'Artist Two',
    'Track Title Two'
);