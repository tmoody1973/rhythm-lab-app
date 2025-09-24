-- Simple check of user_id column type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mixcloud_oauth_tokens'
AND column_name = 'user_id';