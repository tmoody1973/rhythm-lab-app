-- Migration 021: Remove slug field constraint from shows table
-- The slug field is not being used by the new API and causing NOT NULL constraint violations

-- Drop the unique constraint on slug first
ALTER TABLE shows DROP CONSTRAINT IF EXISTS shows_slug_key;

-- Drop the index on slug
DROP INDEX IF EXISTS idx_shows_slug;

-- Make slug nullable (remove NOT NULL constraint)
ALTER TABLE shows ALTER COLUMN slug DROP NOT NULL;

-- Optional: We could also remove the column entirely, but making it nullable is safer
-- ALTER TABLE shows DROP COLUMN IF EXISTS slug;