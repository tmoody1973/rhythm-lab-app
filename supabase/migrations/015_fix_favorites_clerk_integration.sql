-- Fix user_favorites to work with Clerk JWT integration

-- First drop ALL existing RLS policies that depend on user_id column
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;

-- Drop the old foreign key constraint since user_id will now be Clerk user IDs
ALTER TABLE user_favorites DROP CONSTRAINT IF EXISTS user_favorites_user_id_fkey;

-- Change user_id column to TEXT to store Clerk user IDs
ALTER TABLE user_favorites ALTER COLUMN user_id TYPE TEXT;

-- Create new RLS policies that work with both Clerk and Supabase auth
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (
    user_id = auth.jwt()->>'sub' -- Clerk user ID from JWT
    OR
    user_id = auth.uid()::text -- Supabase user ID (for admin users)
  );

CREATE POLICY "Users can create own favorites" ON user_favorites
  FOR INSERT WITH CHECK (
    user_id = auth.jwt()->>'sub' -- Clerk user ID from JWT
    OR
    user_id = auth.uid()::text -- Supabase user ID (for admin users)
  );

CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (
    user_id = auth.jwt()->>'sub' -- Clerk user ID from JWT
    OR
    user_id = auth.uid()::text -- Supabase user ID (for admin users)
  );

-- Similarly update profiles table to work better with Clerk
-- The profiles table can be optional for Clerk users since user info comes from JWT
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create a more flexible profile creation function for Clerk users
CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_clerk_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id uuid;
  clerk_id text;
  user_email text;
  user_name text;
BEGIN
  -- Get Clerk user ID from JWT
  clerk_id := auth.jwt()->>'sub';

  -- Get email and name from JWT claims
  user_email := auth.jwt()->>'email';
  user_name := coalesce(auth.jwt()->>'name', auth.jwt()->>'email');

  -- Check if profile exists
  SELECT id INTO profile_id
  FROM profiles
  WHERE clerk_user_id = clerk_id;

  -- Create profile if it doesn't exist
  IF profile_id IS NULL THEN
    INSERT INTO profiles (clerk_user_id, email, full_name)
    VALUES (clerk_id, user_email, user_name)
    RETURNING id INTO profile_id;
  END IF;

  RETURN profile_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_clerk_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_clerk_user() TO anon;