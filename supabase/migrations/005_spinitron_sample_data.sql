-- Insert sample Spinitron songs data
INSERT INTO public.songs (
  spinitron_id,
  song,
  artist,
  release,
  label,
  start_time,
  duration,
  episode_title,
  station_id,
  is_manual
) VALUES
(
  12345,
  'Weightless',
  'Marconi Union',
  'Weightless',
  'Just Music',
  NOW() - INTERVAL '10 minutes',
  480,
  'AMBIENT SOUNDSCAPES VOL. 12',
  'rlr-main',
  false
),
(
  12346,
  'An Ending (Ascent)',
  'Brian Eno',
  'Apollo: Atmospheres and Soundtracks',
  'EG Records',
  NOW() - INTERVAL '18 minutes',
  320,
  'AMBIENT SOUNDSCAPES VOL. 12',
  'rlr-main',
  false
),
(
  12347,
  'Svefn-g-englar',
  'Sigur Rós',
  'Ágætis byrjun',
  'FatCat Records',
  NOW() - INTERVAL '28 minutes',
  600,
  'AMBIENT SOUNDSCAPES VOL. 12',
  'rlr-main',
  false
),
(
  12348,
  'Music for Airports 1/1',
  'Brian Eno',
  'Ambient 1: Music for Airports',
  'Polydor',
  NOW() - INTERVAL '38 minutes',
  1020,
  'AMBIENT SOUNDSCAPES VOL. 12',
  'rlr-main',
  false
),
(
  12349,
  'Avril 14th',
  'Aphex Twin',
  'Drukqs',
  'Warp Records',
  NOW() - INTERVAL '55 minutes',
  120,
  'AMBIENT SOUNDSCAPES VOL. 12',
  'rlr-main',
  false
),
(
  12350,
  'Metamorphosis Two',
  'Philip Glass',
  'Solo Piano',
  'Orange Mountain Music',
  NOW() - INTERVAL '60 minutes',
  300,
  'AMBIENT SOUNDSCAPES VOL. 12',
  'rlr-main',
  false
),
(
  12351,
  'Ryo',
  'Kiasmos',
  'Ryo EP',
  'Erased Tapes',
  NOW() - INTERVAL '5 minutes',
  420,
  'Current Live Show',
  'rlr-main',
  false
),
(
  12352,
  'Circular Motion',
  'Thom Yorke',
  'Tomorrow''s Modern Boxes',
  'XL Recordings',
  NOW(),
  240,
  'Current Live Show',
  'rlr-main',
  false
);

-- Update live stream with current song
UPDATE public.live_stream
SET
  current_track_title = 'Circular Motion',
  current_track_artist = 'Thom Yorke',
  current_show_title = 'Current Live Show',
  is_live = true,
  listeners_count = 247,
  updated_at = NOW();