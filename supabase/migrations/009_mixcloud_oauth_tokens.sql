-- Add OAuth tokens table for Mixcloud authentication
-- This stores OAuth access tokens for Mixcloud upload API access

CREATE TABLE mixcloud_oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ,
    scope TEXT,
    mixcloud_user_id VARCHAR(100), -- Mixcloud user ID from token response
    mixcloud_username VARCHAR(100), -- Mixcloud username from token response
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Only one active token per user
    UNIQUE(user_id)
);

-- Enable RLS for OAuth tokens
ALTER TABLE mixcloud_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can manage their own OAuth tokens" ON mixcloud_oauth_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Only admin users can access all tokens (for debugging/management)
CREATE POLICY "Admins can view all OAuth tokens" ON mixcloud_oauth_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE TRIGGER update_mixcloud_oauth_tokens_updated_at
    BEFORE UPDATE ON mixcloud_oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_mixcloud_oauth_tokens_user_id ON mixcloud_oauth_tokens(user_id);
CREATE INDEX idx_mixcloud_oauth_tokens_expires_at ON mixcloud_oauth_tokens(expires_at);
CREATE INDEX idx_mixcloud_oauth_tokens_username ON mixcloud_oauth_tokens(mixcloud_username);

-- Add upload_jobs table for tracking upload status
CREATE TABLE upload_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    storage_path TEXT, -- Supabase storage path for backup
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, uploading, uploaded, failed, queued
    mixcloud_url VARCHAR(500), -- Final Mixcloud URL after successful upload
    mixcloud_embed TEXT, -- Embed code from Mixcloud
    mixcloud_picture VARCHAR(500), -- Cover image URL from Mixcloud

    -- Show metadata
    show_title VARCHAR(255) NOT NULL,
    show_description TEXT,
    show_tags JSONB DEFAULT '[]',
    publish_date TIMESTAMPTZ NOT NULL,

    -- Playlist data
    playlist_text TEXT,
    parsed_tracks JSONB DEFAULT '[]', -- Parsed track data

    -- Progress and error tracking
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS for upload_jobs
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own upload jobs
CREATE POLICY "Users can manage their own upload jobs" ON upload_jobs
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Admins can view all upload jobs
CREATE POLICY "Admins can view all upload jobs" ON upload_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE TRIGGER update_upload_jobs_updated_at
    BEFORE UPDATE ON upload_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for upload_jobs
CREATE INDEX idx_upload_jobs_user_id ON upload_jobs(user_id);
CREATE INDEX idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX idx_upload_jobs_created_at ON upload_jobs(created_at DESC);
CREATE INDEX idx_upload_jobs_retry ON upload_jobs(status, retry_count) WHERE status = 'failed';