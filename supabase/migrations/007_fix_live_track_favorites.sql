-- Fix user_favorites table to support live track favorites
-- 1. Add 'live_track' to the allowed item_type values
-- 2. Change item_id from UUID to TEXT to store track info

-- Drop the existing constraint
ALTER TABLE public.user_favorites
DROP CONSTRAINT user_favorites_item_type_check;

-- Add the new constraint with 'live_track' included
ALTER TABLE public.user_favorites
ADD CONSTRAINT user_favorites_item_type_check
CHECK (item_type IN ('show', 'track', 'blog_post', 'artist_profile', 'deep_dive', 'live_track'));

-- Change item_id column from UUID to TEXT
ALTER TABLE public.user_favorites
ALTER COLUMN item_id TYPE TEXT;