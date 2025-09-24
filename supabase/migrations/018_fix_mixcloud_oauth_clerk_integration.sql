-- Fix Mixcloud OAuth tokens table to work with Clerk authentication
-- Change from UUID reference to auth.users to TEXT reference to profiles.clerk_user_id

-- STEP 1: Drop all policies first (they prevent column type changes)
DROP POLICY IF EXISTS "Users can manage their own OAuth tokens" ON mixcloud_oauth_tokens;
DROP POLICY IF EXISTS "Admins can view all OAuth tokens" ON mixcloud_oauth_tokens;

-- STEP 2: Drop existing table constraints
ALTER TABLE mixcloud_oauth_tokens DROP CONSTRAINT IF EXISTS mixcloud_oauth_tokens_user_id_fkey;
ALTER TABLE mixcloud_oauth_tokens DROP CONSTRAINT IF EXISTS mixcloud_oauth_tokens_user_id_key;

-- STEP 3: Drop and recreate indexes
DROP INDEX IF EXISTS idx_mixcloud_oauth_tokens_user_id;

-- STEP 4: Change user_id column from UUID to TEXT to store Clerk user IDs
ALTER TABLE mixcloud_oauth_tokens ALTER COLUMN user_id TYPE TEXT;

-- STEP 5: Add foreign key constraint to profiles.clerk_user_id
ALTER TABLE mixcloud_oauth_tokens
ADD CONSTRAINT mixcloud_oauth_tokens_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(clerk_user_id) ON DELETE CASCADE;

-- STEP 6: Re-add unique constraint
ALTER TABLE mixcloud_oauth_tokens ADD CONSTRAINT mixcloud_oauth_tokens_user_id_key UNIQUE (user_id);

-- STEP 7: Recreate indexes
CREATE INDEX idx_mixcloud_oauth_tokens_user_id ON mixcloud_oauth_tokens(user_id);

-- Create new policies that work with Clerk authentication
CREATE POLICY "Users can manage their own OAuth tokens" ON mixcloud_oauth_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.clerk_user_id = mixcloud_oauth_tokens.user_id
            AND profiles.clerk_user_id = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY "Admins can view all OAuth tokens" ON mixcloud_oauth_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.clerk_user_id = current_setting('app.current_user_id', true)
            AND profiles.role = 'admin'
        )
    );

-- Update indexes
DROP INDEX IF EXISTS idx_mixcloud_oauth_tokens_user_id;
CREATE INDEX idx_mixcloud_oauth_tokens_user_id ON mixcloud_oauth_tokens(user_id);