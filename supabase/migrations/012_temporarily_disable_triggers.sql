-- Temporarily disable triggers to debug signup 500 error
-- This will help us identify if the triggers are causing the "unexpected_failure" error

-- Disable the triggers temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Keep the functions for manual testing but remove triggers
-- We can re-enable them once we confirm they work properly