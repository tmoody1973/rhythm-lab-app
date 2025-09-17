-- Add role column to profiles table for admin authentication
-- Default role is 'user', with options for 'admin' and 'super_admin'

-- Add role column with default value
ALTER TABLE public.profiles
ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Add constraint to ensure only valid roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index on role column for faster queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have 'user' role (if any exist without role)
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;