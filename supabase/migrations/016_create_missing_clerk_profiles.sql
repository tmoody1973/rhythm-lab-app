-- Create profiles for Clerk users who have favorites but no profile
-- This handles the case where users started using the app before profiles were properly created

-- First, let's create profiles for any Clerk users in user_favorites who don't have a profile
INSERT INTO profiles (id, clerk_user_id, email, full_name, created_at, updated_at)
SELECT DISTINCT
  gen_random_uuid() as id,
  uf.user_id as clerk_user_id,
  uf.user_id as email, -- We'll use the Clerk ID as a placeholder for now
  uf.user_id as full_name, -- We'll use the Clerk ID as a placeholder for now
  NOW() as created_at,
  NOW() as updated_at
FROM user_favorites uf
LEFT JOIN profiles p ON p.clerk_user_id = uf.user_id
WHERE
  uf.user_id LIKE 'user_%' -- Only Clerk users (they start with 'user_')
  AND p.id IS NULL; -- Only where profile doesn't exist

-- Note: To properly populate email and full_name, you would need to:
-- 1. Use Clerk's API to fetch user details
-- 2. Or wait for the user to sign in again (which will trigger profile creation with proper details)
-- 3. Or manually update the profiles table with the correct email addresses