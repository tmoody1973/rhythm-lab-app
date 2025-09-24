-- Test the exact profile lookup that's failing
SELECT id, clerk_user_id, email, full_name, role
FROM profiles
WHERE clerk_user_id = 'user_32qUkjxFUSGw5ZuvHxYlXwZdH0e';