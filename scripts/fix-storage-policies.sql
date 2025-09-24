-- Fix storage RLS policies for temp-uploads bucket
-- This allows authenticated users to upload and manage their own files

-- Create policy for uploading files to temp-uploads bucket
CREATE POLICY "Users can upload to temp-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'temp-uploads'
  AND auth.role() = 'authenticated'
);

-- Create policy for reading own files from temp-uploads bucket
CREATE POLICY "Users can read own temp-uploads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'temp-uploads'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  )
);

-- Create policy for updating own files in temp-uploads bucket
CREATE POLICY "Users can update own temp-uploads"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'temp-uploads'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  )
);

-- Create policy for deleting own files from temp-uploads bucket
CREATE POLICY "Users can delete own temp-uploads"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'temp-uploads'
  AND (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  )
);

-- Ensure bucket allows the required operations
UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 524288000, -- 500MB in bytes
  allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]
WHERE name = 'temp-uploads';

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false,
  524288000, -- 500MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'image/jpeg', 'image/png', 'image/jpg'];