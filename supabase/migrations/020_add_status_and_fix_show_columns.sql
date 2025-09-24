-- Migration 020: Add status column to shows table
-- This ensures compatibility with the new Mixcloud sync API

-- Add status column for show management (draft, published, archived)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published' NOT NULL;

-- Add constraint for valid status values
ALTER TABLE shows ADD CONSTRAINT shows_status_check
    CHECK (status IN ('draft', 'published', 'archived'));

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_shows_status ON shows(status);

-- Update any existing records to have published status
UPDATE shows SET status = 'published' WHERE status IS NULL;

COMMENT ON COLUMN shows.status IS 'Show publication status: draft, published, or archived';