-- Fix profile mapping for Clerk user - SIMPLE VERSION
-- Run this in Supabase SQL Editor

-- First, check if there's an existing profile with the email but no clerk_user_id
UPDATE profiles
SET clerk_user_id = 'user_32qUkjxFUSGw5ZuvHxYlXwZdH0e'
WHERE email = 'tarikjmoody@gmail.com'
AND clerk_user_id IS NULL;

-- If no existing profile was updated, create a new one
INSERT INTO profiles (id, clerk_user_id, email, full_name, role, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'user_32qUkjxFUSGw5ZuvHxYlXwZdH0e',
  'tarikjmoody@gmail.com',
  'Tarik Moody',
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles
  WHERE clerk_user_id = 'user_32qUkjxFUSGw5ZuvHxYlXwZdH0e'
);

-- Verify the profile exists
SELECT id, clerk_user_id, email, full_name, role
FROM profiles
WHERE clerk_user_id = 'user_32qUkjxFUSGw5ZuvHxYlXwZdH0e';