-- Test the exact token lookup that the getMixcloudToken function does

-- Step 1: Get profile UUID for Clerk user (this should work)
SELECT id, clerk_user_id, email
FROM profiles
WHERE clerk_user_id = 'user_32qUkjxFUSGw5ZuvHxYlXwZdH0e';

-- Step 2: Get token by profile UUID (this might be failing due to RLS)
SELECT id, user_id, token_type, created_at
FROM mixcloud_oauth_tokens
WHERE user_id = '4caac7ca-1186-49f6-af80-a97ef33ac20c';