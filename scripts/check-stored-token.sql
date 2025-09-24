-- Check what's actually stored in the access token
SELECT
    id,
    user_id,
    -- Show just first/last few characters of access token for security
    LEFT(access_token, 10) || '...' || RIGHT(access_token, 10) as token_preview,
    LENGTH(access_token) as token_length,
    token_type,
    expires_at,
    scope,
    mixcloud_user_id,
    mixcloud_username,
    created_at
FROM mixcloud_oauth_tokens
WHERE user_id = '4caac7ca-1186-49f6-af80-a97ef33ac20c';