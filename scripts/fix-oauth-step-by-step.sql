-- STEP 1: Drop policies first
DROP POLICY IF EXISTS "Users can manage their own OAuth tokens" ON mixcloud_oauth_tokens;
DROP POLICY IF EXISTS "Admins can view all OAuth tokens" ON mixcloud_oauth_tokens;
DROP POLICY IF EXISTS "Service role can manage all OAuth tokens" ON mixcloud_oauth_tokens;

-- STEP 2: Drop constraints
ALTER TABLE mixcloud_oauth_tokens DROP CONSTRAINT IF EXISTS mixcloud_oauth_tokens_user_id_fkey;
ALTER TABLE mixcloud_oauth_tokens DROP CONSTRAINT IF EXISTS mixcloud_oauth_tokens_user_id_key;

-- STEP 3: Drop indexes
DROP INDEX IF EXISTS idx_mixcloud_oauth_tokens_user_id;

-- STEP 4: Clear existing data to avoid conversion issues
DELETE FROM mixcloud_oauth_tokens;

-- STEP 5: Convert column back to UUID
ALTER TABLE mixcloud_oauth_tokens ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- STEP 6: Add foreign key to profiles.id
ALTER TABLE mixcloud_oauth_tokens
ADD CONSTRAINT mixcloud_oauth_tokens_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- STEP 7: Add unique constraint
ALTER TABLE mixcloud_oauth_tokens ADD CONSTRAINT mixcloud_oauth_tokens_user_id_key UNIQUE (user_id);

-- STEP 8: Recreate index
CREATE INDEX idx_mixcloud_oauth_tokens_user_id ON mixcloud_oauth_tokens(user_id);

-- STEP 9: Create policies for service role access
CREATE POLICY "Service role can manage all OAuth tokens" ON mixcloud_oauth_tokens
    FOR ALL USING (current_setting('role', true) = 'service_role');

-- STEP 10: Create policy for users
CREATE POLICY "Users can manage their own OAuth tokens" ON mixcloud_oauth_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = mixcloud_oauth_tokens.user_id
            AND profiles.clerk_user_id = current_setting('app.current_user_id', true)
        )
    );

-- STEP 11: Create policy for admins
CREATE POLICY "Admins can view all OAuth tokens" ON mixcloud_oauth_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.clerk_user_id = current_setting('app.current_user_id', true)
            AND profiles.role = 'admin'
        )
    );