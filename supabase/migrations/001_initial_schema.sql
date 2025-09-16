-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  favorite_genres TEXT[],
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shows/Episodes table
CREATE TABLE public.shows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  show_date DATE NOT NULL,
  duration_minutes INTEGER,
  artwork_url TEXT,
  mixcloud_url TEXT,
  soundcloud_url TEXT,
  spotify_url TEXT,
  apple_music_url TEXT,
  youtube_url TEXT,
  guest_artist TEXT,
  guest_bio TEXT,
  genre_tags TEXT[],
  play_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_live BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks table (individual songs from shows)
CREATE TABLE public.tracks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  label TEXT,
  release_year INTEGER,
  genre TEXT,
  duration_seconds INTEGER,
  play_order INTEGER, -- Order within the show
  spotify_track_id TEXT,
  apple_music_id TEXT,
  youtube_url TEXT,
  bandcamp_url TEXT,
  soundcloud_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  category TEXT DEFAULT 'general',
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  read_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artist profiles table
CREATE TABLE public.artist_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  origin_country TEXT,
  origin_city TEXT,
  genres TEXT[],
  profile_image_url TEXT,
  banner_image_url TEXT,
  website_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  soundcloud_url TEXT,
  spotify_url TEXT,
  bandcamp_url TEXT,
  youtube_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deep dives table (long-form content)
CREATE TABLE public.deep_dives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  subject_type TEXT CHECK (subject_type IN ('artist', 'genre', 'album', 'movement', 'technique')),
  subject_name TEXT, -- e.g., "Miles Davis", "Jazz Fusion", "Kind of Blue"
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  estimated_read_time INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites table
CREATE TABLE public.user_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('show', 'track', 'blog_post', 'artist_profile', 'deep_dive')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- User listening history
CREATE TABLE public.listening_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
  listened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_listened_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE
);

-- News ticker content table (for CMS)
CREATE TABLE public.news_ticker (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- Higher priority shows first
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live stream status table
CREATE TABLE public.live_stream (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_live BOOLEAN DEFAULT FALSE,
  current_track_title TEXT,
  current_track_artist TEXT,
  current_show_title TEXT,
  listeners_count INTEGER DEFAULT 0,
  stream_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shows_show_date ON public.shows(show_date DESC);
CREATE INDEX idx_shows_is_featured ON public.shows(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_tracks_show_id ON public.tracks(show_id);
CREATE INDEX idx_tracks_artist ON public.tracks(artist);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_artist_profiles_slug ON public.artist_profiles(slug);
CREATE INDEX idx_deep_dives_published ON public.deep_dives(is_published, published_at DESC);
CREATE INDEX idx_deep_dives_slug ON public.deep_dives(slug);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_listening_history_user_id ON public.listening_history(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER artist_profiles_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER deep_dives_updated_at
  BEFORE UPDATE ON public.deep_dives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER news_ticker_updated_at
  BEFORE UPDATE ON public.news_ticker
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();