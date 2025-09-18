-- Create storage bucket for temporary uploads
-- This bucket stores audio files temporarily during the upload process

-- Create the temp-uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-uploads', 'temp-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the bucket
UPDATE storage.buckets
SET public = false
WHERE id = 'temp-uploads';

-- Policy: Allow authenticated users to upload to temp-uploads
CREATE POLICY "Authenticated users can upload temp files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-uploads');

-- Policy: Allow authenticated users to read their own temp files
CREATE POLICY "Users can read their own temp files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow authenticated users to delete their own temp files
CREATE POLICY "Users can delete their own temp files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'temp-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow admin users to manage all temp files
CREATE POLICY "Admins can manage all temp files"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'temp-uploads' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);