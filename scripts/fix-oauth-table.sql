-- Execute this SQL directly in Supabase SQL Editor
-- This fixes the mixcloud_oauth_tokens table to work properly with profile UUIDs

-- STEP 1: Drop all policies first (they prevent column type changes)
DROP POLICY IF EXISTS "Users can manage their own OAuth tokens" ON mixcloud_oauth_tokens;
DROP POLICY IF EXISTS "Admins can view all OAuth tokens" ON mixcloud_oauth_tokens;

-- STEP 2: Drop existing table constraints
ALTER TABLE mixcloud_oauth_tokens DROP CONSTRAINT IF EXISTS mixcloud_oauth_tokens_user_id_fkey;
ALTER TABLE mixcloud_oauth_tokens DROP CONSTRAINT IF EXISTS mixcloud_oauth_tokens_user_id_key;

-- STEP 3: Drop and recreate indexes
DROP INDEX IF EXISTS idx_mixcloud_oauth_tokens_user_id;

-- STEP 4: Check current column type and change if needed
DO $$
BEGIN
    -- Try to convert TEXT back to UUID if it was changed in migration 018
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'mixcloud_oauth_tokens' AND column_name = 'user_id') = 'text' THEN

        -- Clear any existing data that might cause conversion issues
        DELETE FROM mixcloud_oauth_tokens;

        -- Convert back to UUID
        ALTER TABLE mixcloud_oauth_tokens ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
    END IF;
END $$;

-- STEP 5: Add foreign key constraint to profiles.id (UUID)
ALTER TABLE mixcloud_oauth_tokens
ADD CONSTRAINT mixcloud_oauth_tokens_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- STEP 6: Re-add unique constraint
ALTER TABLE mixcloud_oauth_tokens ADD CONSTRAINT mixcloud_oauth_tokens_user_id_key UNIQUE (user_id);

-- STEP 7: Recreate indexes
CREATE INDEX idx_mixcloud_oauth_tokens_user_id ON mixcloud_oauth_tokens(user_id);

-- STEP 8: Create new policies that work with Clerk authentication via profiles
-- Allow users to manage their own tokens by checking profile.clerk_user_id
CREATE POLICY "Users can manage their own OAuth tokens" ON mixcloud_oauth_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = mixcloud_oauth_tokens.user_id
            AND profiles.clerk_user_id = current_setting('app.current_user_id', true)
        )
    );

-- Allow service role to bypass RLS completely (for OAuth callback operations)
CREATE POLICY "Service role can manage all OAuth tokens" ON mixcloud_oauth_tokens
    FOR ALL USING (
        current_setting('role', true) = 'service_role'
    );

-- Allow admins to view all tokens
CREATE POLICY "Admins can view all OAuth tokens" ON mixcloud_oauth_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.clerk_user_id = current_setting('app.current_user_id', true)
            AND profiles.role = 'admin'
        )
    );

-- STEP 9: Also fix upload_jobs table to reference profiles.id instead of auth.users
ALTER TABLE upload_jobs DROP CONSTRAINT IF EXISTS upload_jobs_user_id_fkey;
ALTER TABLE upload_jobs
ADD CONSTRAINT upload_jobs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;