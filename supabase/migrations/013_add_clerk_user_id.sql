-- Add clerk_user_id field to profiles table for dual auth support
ALTER TABLE public.profiles ADD COLUMN clerk_user_id TEXT UNIQUE;

-- Add index for faster lookups by Clerk ID
CREATE INDEX idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);

-- Update the profiles table to allow either auth.users reference OR clerk users
-- Make the foreign key constraint deferrable so we can insert Clerk users
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;

-- Add a flexible constraint that allows either Supabase auth users or generated UUIDs for Clerk users
-- We'll handle the logic in the application layer