-- Fix profile creation trigger to include required fields and handle email confirmation

-- Drop ALL existing triggers first, then the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that includes all required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if user is confirmed (email verified)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      username,
      full_name,
      avatar_url,
      role,
      is_premium,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      'user',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users (only when email is confirmed)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for email confirmation updates
CREATE OR REPLACE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Add function to safely create profile from application code
CREATE OR REPLACE FUNCTION public.create_profile_if_not_exists(
  user_id UUID,
  user_email TEXT,
  user_username TEXT DEFAULT NULL,
  user_full_name TEXT DEFAULT NULL,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    avatar_url,
    role,
    is_premium,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    COALESCE(user_username, split_part(user_email, '@', 1)),
    user_full_name,
    user_avatar_url,
    'user',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_profile_if_not_exists TO authenticated;