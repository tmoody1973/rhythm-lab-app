-- Fix existing profiles that have Clerk user ID in the email field
-- Update them to have proper clerk_user_id field populated
UPDATE profiles
SET clerk_user_id = email
WHERE email LIKE 'user_%' -- These are Clerk user IDs mistakenly stored in email field
AND clerk_user_id IS NULL;

-- For now, keep the Clerk ID in email field (since it has NOT NULL constraint)
-- We'll update it with real emails when users sign in
-- Just make sure clerk_user_id is properly set

-- Create profiles for any Clerk users in user_favorites who don't have a profile
INSERT INTO profiles (id, clerk_user_id, email, full_name, created_at, updated_at)
SELECT DISTINCT
  gen_random_uuid() as id,
  uf.user_id as clerk_user_id,
  NULL as email, -- Leave NULL, will be populated on next sign in
  NULL as full_name, -- Leave NULL, will be populated on next sign in
  NOW() as created_at,
  NOW() as updated_at
FROM user_favorites uf
LEFT JOIN profiles p ON p.clerk_user_id = uf.user_id
WHERE
  uf.user_id LIKE 'user_%' -- Only Clerk users (they start with 'user_')
  AND p.id IS NULL -- Only where profile doesn't exist
ON CONFLICT DO NOTHING; -- Skip if profile already exists

-- Note: To properly populate email and full_name, you would need to:
-- 1. Use Clerk's API to fetch user details
-- 2. Or wait for the user to sign in again (which will trigger profile creation with proper details)
-- 3. Or manually update the profiles table with the correct email addresses