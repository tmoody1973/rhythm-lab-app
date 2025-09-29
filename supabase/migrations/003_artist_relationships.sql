-- Artist Influence Graph Database Schema
-- This migration adds tables to track artist relationships and collaborations

-- Artist relationships table - tracks connections between artists
CREATE TABLE public.artist_relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  target_artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'collaboration',     -- Artists who have collaborated on tracks
    'remix',            -- Artist A remixed Artist B's work
    'featured',         -- Artist A featured Artist B (or vice versa)
    'producer',         -- Artist A produced for Artist B
    'label_mate',       -- Artists on the same record label
    'influence',        -- Documented musical influence
    'side_project',     -- Artists who are part of same side project
    'group_member'      -- Artists who are/were in same group
  )),
  strength DECIMAL(3,2) DEFAULT 1.0 CHECK (strength >= 0 AND strength <= 10), -- Relationship strength (0-10)
  source_data JSONB DEFAULT '{}', -- Metadata about where this relationship was discovered
  evidence_tracks TEXT[], -- Array of track IDs that provide evidence
  evidence_releases TEXT[], -- Array of release IDs that provide evidence
  first_collaboration_date DATE, -- Earliest known collaboration
  last_collaboration_date DATE, -- Most recent collaboration
  collaboration_count INTEGER DEFAULT 1, -- Number of known collaborations
  verified BOOLEAN DEFAULT FALSE, -- Whether this relationship has been manually verified
  notes TEXT, -- Additional notes about the relationship
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate relationships (order doesn't matter for most types)
  UNIQUE(source_artist_id, target_artist_id, relationship_type)
);

-- Track credits table - detailed credits for each track
-- Note: track_id can reference any track table (archive_tracks, songs, etc)
-- The reference is stored as UUID but without foreign key constraint for flexibility
CREATE TABLE public.track_credits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  track_id UUID, -- Can reference archive_tracks.id or songs.id
  track_table TEXT DEFAULT 'archive_tracks', -- Which table this track belongs to
  artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL CHECK (credit_type IN (
    'main_artist',      -- Primary performing artist
    'featured_artist',  -- Featured or guest artist
    'producer',         -- Producer credit
    'engineer',         -- Engineering credit
    'mixer',           -- Mixing credit
    'songwriter',      -- Songwriting credit
    'composer',        -- Composition credit
    'remixer',         -- Remix credit
    'vocalist',        -- Additional vocals
    'instrumentalist', -- Played instruments
    'arranger'         -- Musical arrangement
  )),
  role_details TEXT, -- Specific role details (e.g., "lead guitar", "background vocals")
  source_api TEXT CHECK (source_api IN ('discogs', 'spotify', 'manual')), -- Where this credit was sourced
  source_id TEXT, -- External ID from source API
  confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1), -- Confidence in this credit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate credits
  UNIQUE(track_id, artist_id, credit_type)
);

-- Label relationships table - tracks which artists are on the same labels
CREATE TABLE public.label_relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  label_name TEXT NOT NULL,
  label_discogs_id INTEGER, -- Discogs label ID if available
  active_from DATE, -- When artist joined label
  active_to DATE, -- When artist left label (NULL if still active)
  release_count INTEGER DEFAULT 0, -- Number of releases on this label
  source_data JSONB DEFAULT '{}', -- Metadata from APIs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced artist profiles with additional metadata
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS discogs_id INTEGER UNIQUE;
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS real_name TEXT;
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS aliases TEXT[];
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS group_members TEXT[];
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS associated_acts TEXT[];
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS active_years_start INTEGER;
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS active_years_end INTEGER;
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}';

-- Enhanced tracks table with additional metadata
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS discogs_release_id INTEGER;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS discogs_master_id INTEGER;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS producer_credits TEXT[];
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS featured_artists TEXT[];
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS remix_of_track_id UUID REFERENCES public.tracks(id);
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS original_release_date DATE;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS track_metadata JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX idx_artist_relationships_source ON public.artist_relationships(source_artist_id);
CREATE INDEX idx_artist_relationships_target ON public.artist_relationships(target_artist_id);
CREATE INDEX idx_artist_relationships_type ON public.artist_relationships(relationship_type);
CREATE INDEX idx_artist_relationships_strength ON public.artist_relationships(strength DESC);
CREATE INDEX idx_artist_relationships_verified ON public.artist_relationships(verified);

CREATE INDEX idx_track_credits_track ON public.track_credits(track_id);
CREATE INDEX idx_track_credits_artist ON public.track_credits(artist_id);
CREATE INDEX idx_track_credits_type ON public.track_credits(credit_type);
CREATE INDEX idx_track_credits_source ON public.track_credits(source_api);

CREATE INDEX idx_label_relationships_artist ON public.label_relationships(artist_id);
CREATE INDEX idx_label_relationships_label ON public.label_relationships(label_name);
CREATE INDEX idx_label_relationships_active ON public.label_relationships(active_from, active_to);

CREATE INDEX idx_artist_profiles_discogs ON public.artist_profiles(discogs_id) WHERE discogs_id IS NOT NULL;
CREATE INDEX idx_artist_profiles_spotify ON public.artist_profiles(spotify_id) WHERE spotify_id IS NOT NULL;

CREATE INDEX idx_tracks_discogs_release ON public.tracks(discogs_release_id) WHERE discogs_release_id IS NOT NULL;
CREATE INDEX idx_tracks_remix_of ON public.tracks(remix_of_track_id) WHERE remix_of_track_id IS NOT NULL;

-- Apply updated_at triggers to new tables
CREATE TRIGGER artist_relationships_updated_at
  BEFORE UPDATE ON public.artist_relationships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER label_relationships_updated_at
  BEFORE UPDATE ON public.label_relationships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Views for easier querying

-- Artist collaboration network view
CREATE VIEW public.artist_collaboration_network AS
SELECT
  ar.id,
  sp.name as source_artist_name,
  sp.slug as source_artist_slug,
  tp.name as target_artist_name,
  tp.slug as target_artist_slug,
  ar.relationship_type,
  ar.strength,
  ar.collaboration_count,
  ar.first_collaboration_date,
  ar.last_collaboration_date,
  ar.verified
FROM public.artist_relationships ar
JOIN public.artist_profiles sp ON ar.source_artist_id = sp.id
JOIN public.artist_profiles tp ON ar.target_artist_id = tp.id
WHERE ar.strength > 0;

-- Artist influence score view (based on relationships)
CREATE VIEW public.artist_influence_scores AS
SELECT
  ap.id,
  ap.name,
  ap.slug,
  COUNT(DISTINCT ar1.target_artist_id) as influenced_artists_count,
  COUNT(DISTINCT ar2.source_artist_id) as influenced_by_count,
  AVG(ar1.strength) as avg_outgoing_influence,
  AVG(ar2.strength) as avg_incoming_influence,
  COUNT(DISTINCT tc.track_id) as total_credits,
  COUNT(DISTINCT lr.label_name) as label_count
FROM public.artist_profiles ap
LEFT JOIN public.artist_relationships ar1 ON ap.id = ar1.source_artist_id
LEFT JOIN public.artist_relationships ar2 ON ap.id = ar2.target_artist_id
LEFT JOIN public.track_credits tc ON ap.id = tc.artist_id
LEFT JOIN public.label_relationships lr ON ap.id = lr.artist_id
GROUP BY ap.id, ap.name, ap.slug;

-- Track collaboration details view
-- Note: This view will be created only if tracks table exists
-- You can create it later when tracks table is available
-- CREATE VIEW public.track_collaboration_details AS
-- SELECT
--   t.id as track_id,
--   t.title,
--   t.artist as main_artist,
--   t.album,
--   t.label,
--   t.release_year,
--   ARRAY_AGG(DISTINCT ap.name) FILTER (WHERE tc.credit_type = 'featured_artist') as featured_artists,
--   ARRAY_AGG(DISTINCT ap.name) FILTER (WHERE tc.credit_type = 'producer') as producers,
--   ARRAY_AGG(DISTINCT ap.name) FILTER (WHERE tc.credit_type IN ('songwriter', 'composer')) as writers,
--   COUNT(DISTINCT tc.artist_id) as total_credits
-- FROM public.tracks t
-- LEFT JOIN public.track_credits tc ON t.id = tc.track_id
-- LEFT JOIN public.artist_profiles ap ON tc.artist_id = ap.id
-- GROUP BY t.id, t.title, t.artist, t.album, t.label, t.release_year;

-- Functions for relationship management

-- Function to automatically create bidirectional relationships
CREATE OR REPLACE FUNCTION public.create_bidirectional_relationship(
  artist1_id UUID,
  artist2_id UUID,
  rel_type TEXT,
  strength_val DECIMAL DEFAULT 1.0,
  evidence_data JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  -- Insert relationship in both directions for symmetric relationships
  IF rel_type IN ('collaboration', 'label_mate', 'group_member') THEN
    INSERT INTO public.artist_relationships (
      source_artist_id, target_artist_id, relationship_type, strength, source_data
    ) VALUES (artist1_id, artist2_id, rel_type, strength_val, evidence_data)
    ON CONFLICT (source_artist_id, target_artist_id, relationship_type)
    DO UPDATE SET
      strength = GREATEST(artist_relationships.strength, strength_val),
      collaboration_count = artist_relationships.collaboration_count + 1,
      updated_at = NOW();

    INSERT INTO public.artist_relationships (
      source_artist_id, target_artist_id, relationship_type, strength, source_data
    ) VALUES (artist2_id, artist1_id, rel_type, strength_val, evidence_data)
    ON CONFLICT (source_artist_id, target_artist_id, relationship_type)
    DO UPDATE SET
      strength = GREATEST(artist_relationships.strength, strength_val),
      collaboration_count = artist_relationships.collaboration_count + 1,
      updated_at = NOW();
  ELSE
    -- Asymmetric relationships (producer, remix, featured)
    INSERT INTO public.artist_relationships (
      source_artist_id, target_artist_id, relationship_type, strength, source_data
    ) VALUES (artist1_id, artist2_id, rel_type, strength_val, evidence_data)
    ON CONFLICT (source_artist_id, target_artist_id, relationship_type)
    DO UPDATE SET
      strength = GREATEST(artist_relationships.strength, strength_val),
      collaboration_count = artist_relationships.collaboration_count + 1,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate relationship strength based on collaboration frequency
CREATE OR REPLACE FUNCTION public.calculate_relationship_strength(
  artist1_id UUID,
  artist2_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  collab_count INTEGER;
  time_span_years DECIMAL;
  recency_bonus DECIMAL;
  strength DECIMAL;
BEGIN
  -- Count collaborations between artists
  SELECT COUNT(DISTINCT t.id)
  INTO collab_count
  FROM public.tracks t
  JOIN public.track_credits tc1 ON t.id = tc1.track_id AND tc1.artist_id = artist1_id
  JOIN public.track_credits tc2 ON t.id = tc2.track_id AND tc2.artist_id = artist2_id
  WHERE tc1.artist_id != tc2.artist_id;

  -- Calculate base strength from collaboration count
  strength := LEAST(collab_count * 0.5, 8.0);

  -- Add recency bonus for recent collaborations
  SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, MAX(t.created_at)))
  INTO time_span_years
  FROM public.tracks t
  JOIN public.track_credits tc1 ON t.id = tc1.track_id AND tc1.artist_id = artist1_id
  JOIN public.track_credits tc2 ON t.id = tc2.track_id AND tc2.artist_id = artist2_id;

  recency_bonus := CASE
    WHEN time_span_years <= 1 THEN 1.0
    WHEN time_span_years <= 3 THEN 0.5
    ELSE 0.0
  END;

  RETURN LEAST(strength + recency_bonus, 10.0);
END;
$$ LANGUAGE plpgsql;