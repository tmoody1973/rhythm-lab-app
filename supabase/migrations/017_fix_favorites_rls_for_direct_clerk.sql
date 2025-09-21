-- Fix RLS policies for direct Clerk user ID usage (without JWT integration)
-- This migration updates the RLS policies to work with direct Clerk user IDs
-- since we're using the service role key to bypass RLS in the API

-- First, drop the existing RLS policies
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;

-- Since we're using service role key in the API to handle auth manually,
-- we need to disable RLS on user_favorites table
ALTER TABLE user_favorites DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on profiles table since we're handling auth in the API
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Note: The API is using service_role key which bypasses RLS anyway,
-- so disabling RLS makes the intent clear and avoids confusion.
-- Auth is handled in the API by checking Clerk auth before any database operations.

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);

-- Add a comment to document the auth approach
COMMENT ON TABLE user_favorites IS 'User favorites table. Auth is handled in the API layer using Clerk. RLS is disabled as we use service_role key.';
COMMENT ON TABLE profiles IS 'User profiles table. Auth is handled in the API layer using Clerk. RLS is disabled as we use service_role key.';