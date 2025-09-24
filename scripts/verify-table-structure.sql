-- Verify the current table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'mixcloud_oauth_tokens'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'mixcloud_oauth_tokens';

-- Check foreign keys
SELECT
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu
    ON kcu.constraint_name = ccu.constraint_name
WHERE kcu.table_name = 'mixcloud_oauth_tokens'
    AND kcu.constraint_name LIKE '%fkey%';

-- Check current policies
SELECT
    schemaname,
    tablename,
    policyname,
    qual,
    cmd
FROM pg_policies
WHERE tablename = 'mixcloud_oauth_tokens';