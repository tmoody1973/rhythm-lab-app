-- Check profiles table policies
SELECT
    schemaname,
    tablename,
    policyname,
    qual,
    cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- Also check if RLS is enabled on profiles
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';