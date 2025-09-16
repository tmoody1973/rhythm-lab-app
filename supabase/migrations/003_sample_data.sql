-- Insert sample shows
INSERT INTO public.shows (title, description, show_date, duration_minutes, artwork_url, mixcloud_url, guest_artist, guest_bio, genre_tags, is_featured, status) VALUES
(
  'AMBIENT SOUNDSCAPES VOL. 12',
  'A journey through ethereal soundscapes and atmospheric textures',
  '2024-12-15',
  135,
  '/ambient-ethereal-soundscape-with-floating-particle.jpg',
  'https://mixcloud.com/rhythmlabradio/ambient-soundscapes-vol12',
  NULL,
  NULL,
  ARRAY['ambient', 'electronic', 'experimental'],
  true,
  'published'
),
(
  'DEEP HOUSE SESSIONS #47',
  'Underground deep house selections from Detroit and Chicago',
  '2024-12-12',
  105,
  '/placeholder-eqe3b.png',
  'https://mixcloud.com/rhythmlabradio/deep-house-sessions-47',
  NULL,
  NULL,
  ARRAY['deep house', 'techno', 'underground'],
  false,
  'published'
),
(
  'JAZZ FUSION EXPLORATIONS',
  'Electric jazz journeys from the 70s to contemporary fusion',
  '2024-12-10',
  150,
  '/placeholder-yjpx3.png',
  'https://mixcloud.com/rhythmlabradio/jazz-fusion-explorations',
  NULL,
  NULL,
  ARRAY['jazz', 'fusion', 'electric'],
  false,
  'published'
),
(
  'FOR FOLKS: INTERNATIONAL ANTHEM IRL W/ CARLOS NIÑO & KING HIPPO',
  'A journey through international jazz and hip-hop collaborations',
  '2024-09-18',
  90,
  '/images/dj-blue-purple-lighting.png',
  'https://mixcloud.com/rhythmlabradio/for-folks-international-anthem',
  'Carlos Niño & King Hippo',
  'Experimental jazz and hip-hop producers from Los Angeles',
  ARRAY['jazz', 'soul', 'electronic', 'hip hop'],
  true,
  'published'
);

-- Insert sample tracks for the first show
INSERT INTO public.tracks (show_id, title, artist, album, label, release_year, genre, duration_seconds, play_order) VALUES
(
  (SELECT id FROM public.shows WHERE title = 'AMBIENT SOUNDSCAPES VOL. 12'),
  'Weightless',
  'Marconi Union',
  'Weightless',
  'Just Music',
  2011,
  'ambient',
  480,
  1
),
(
  (SELECT id FROM public.shows WHERE title = 'AMBIENT SOUNDSCAPES VOL. 12'),
  'An Ending (Ascent)',
  'Brian Eno',
  'Apollo: Atmospheres and Soundtracks',
  'EG Records',
  1983,
  'ambient',
  320,
  2
),
(
  (SELECT id FROM public.shows WHERE title = 'AMBIENT SOUNDSCAPES VOL. 12'),
  'Svefn-g-englar',
  'Sigur Rós',
  'Ágætis byrjun',
  'FatCat Records',
  1999,
  'post-rock',
  600,
  3
);

-- Insert sample artist profiles
INSERT INTO public.artist_profiles (name, slug, bio, origin_country, origin_city, genres, profile_image_url, website_url, spotify_url, is_featured) VALUES
(
  'Floating Points',
  'floating-points',
  'Sam Shepherd, known professionally as Floating Points, is a British electronic music producer, DJ, and neuroscientist. His work bridges the gap between scientific research and musical innovation.',
  'United Kingdom',
  'Manchester',
  ARRAY['electronic', 'ambient', 'jazz'],
  '/electronic-music-producer-in-studio-ambient-lighti.jpg',
  'https://floatingpoints.co.uk',
  'https://open.spotify.com/artist/floating-points',
  true
),
(
  'Miles Davis',
  'miles-davis',
  'Miles Dewey Davis III was an American trumpeter, bandleader, and composer. He is among the most influential and acclaimed figures in the history of jazz and 20th-century music.',
  'United States',
  'Alton, Illinois',
  ARRAY['jazz', 'bebop', 'fusion'],
  '/miles-davis-trumpet-silhouette-jazz-atmosphere.jpg',
  NULL,
  'https://open.spotify.com/artist/miles-davis',
  true
);

-- Insert sample blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, featured_image_url, category, tags, is_featured, is_published, published_at, read_time_minutes) VALUES
(
  'The Evolution of Deep House: From Chicago to Global Movement',
  'evolution-deep-house-chicago-global',
  'Exploring how deep house music evolved from the underground clubs of Chicago to become a worldwide phenomenon.',
  'Deep house music emerged in the 1980s in Chicago, born from the creative minds of DJs and producers who wanted to create something more soulful and atmospheric than the harder-edged house music that was dominating the scene...',
  '/placeholder-eqe3b.png',
  'music-history',
  ARRAY['deep house', 'chicago', 'house music', 'electronic'],
  true,
  true,
  NOW() - INTERVAL '2 days',
  8
),
(
  'Behind the Mix: Interview with Underground Producer J-Tech',
  'behind-mix-interview-j-tech',
  'We sit down with rising underground producer J-Tech to discuss their creative process and influences.',
  'In our latest interview series, we caught up with J-Tech, one of the most exciting new voices in underground electronic music...',
  '/images/dj-blue-purple-lighting.png',
  'interviews',
  ARRAY['interview', 'producer', 'underground', 'electronic'],
  false,
  true,
  NOW() - INTERVAL '5 days',
  12
);

-- Insert sample deep dives
INSERT INTO public.deep_dives (title, slug, subtitle, content, featured_image_url, subject_type, subject_name, tags, is_featured, is_published, published_at, estimated_read_time) VALUES
(
  'Miles Davis: From Bebop to Fusion - A Rhythm Lab Perspective',
  'miles-davis-bebop-fusion-rhythm-lab',
  'Exploring Miles Davis''s revolutionary journey through jazz evolution',
  'Miles Davis stands as one of the most transformative figures in jazz history, constantly evolving and pushing the boundaries of what jazz could be. From his early days playing bebop to his revolutionary fusion period...',
  '/miles-davis-trumpet-silhouette-jazz-atmosphere.jpg',
  'artist',
  'Miles Davis',
  ARRAY['jazz', 'bebop', 'fusion'],
  true,
  true,
  NOW() - INTERVAL '1 day',
  25
);

-- Insert sample news ticker content
INSERT INTO public.news_ticker (content, is_active, priority, start_date, end_date) VALUES
(
  'RHYTHM LAB RADIO HAS BEEN REDEFINING THE URBAN SOUND SINCE 2005',
  true,
  1,
  NOW(),
  NULL
),
(
  'NEW EPISODE FEATURING CARLOS NIÑO & KING HIPPO NOW AVAILABLE',
  true,
  2,
  NOW(),
  NOW() + INTERVAL '7 days'
);

-- Insert live stream status
INSERT INTO public.live_stream (is_live, current_track_title, current_track_artist, current_show_title, listeners_count, stream_url) VALUES
(
  false,
  'Weightless',
  'Marconi Union',
  'AMBIENT SOUNDSCAPES VOL. 12',
  0,
  'https://stream.rhythmlabradio.com/live'
);