-- Verify the OAuth token was successfully stored
SELECT
    id,
    user_id,
    token_type,
    expires_at,
    scope,
    mixcloud_user_id,
    mixcloud_username,
    created_at
FROM mixcloud_oauth_tokens
WHERE user_id = '4caac7ca-1186-49f6-af80-a97ef33ac20c';