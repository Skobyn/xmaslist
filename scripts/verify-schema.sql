-- =====================================================
-- SCHEMA VERIFICATION SCRIPT
-- Run this after migrations to verify everything is set up correctly
-- =====================================================

-- Check all tables exist
SELECT 'Tables Check' AS verification_step;
SELECT
    table_name,
    CASE WHEN table_name IN (
        'users', 'locations', 'location_members',
        'lists', 'items', 'shares'
    ) THEN '✓ Present' ELSE '✗ Missing' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS is enabled
SELECT 'RLS Check' AS verification_step;
SELECT
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ Disabled' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count RLS policies per table
SELECT 'RLS Policies Count' AS verification_step;
SELECT
    tablename,
    COUNT(*) AS policy_count,
    CASE WHEN COUNT(*) > 0 THEN '✓ Has Policies' ELSE '✗ No Policies' END AS status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check custom types
SELECT 'Custom Types Check' AS verification_step;
SELECT
    typname AS type_name,
    '✓ Present' AS status
FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typname IN ('share_role', 'resource_type', 'priority_level')
ORDER BY typname;

-- Check functions
SELECT 'Functions Check' AS verification_step;
SELECT
    routine_name AS function_name,
    routine_type,
    '✓ Present' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'has_list_access',
    'has_location_access',
    'get_list_stats',
    'get_location_stats',
    'search_items',
    'share_resource_batch',
    'get_user_accessible_lists',
    'update_updated_at_column',
    'set_purchased_at',
    'handle_new_user',
    'validate_share_permissions',
    'cleanup_expired_shares'
)
ORDER BY routine_name;

-- Check triggers
SELECT 'Triggers Check' AS verification_step;
SELECT
    trigger_name,
    event_object_table AS table_name,
    '✓ Present' AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check indexes
SELECT 'Indexes Check' AS verification_step;
SELECT
    tablename,
    indexname,
    '✓ Present' AS status
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check views
SELECT 'Views Check' AS verification_step;
SELECT
    table_name AS view_name,
    '✓ Present' AS status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('items_with_context', 'lists_with_stats')
ORDER BY table_name;

-- Check extensions
SELECT 'Extensions Check' AS verification_step;
SELECT
    extname AS extension_name,
    extversion AS version,
    '✓ Installed' AS status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- Sample data check (will be empty initially)
SELECT 'Data Check' AS verification_step;
SELECT
    'users' AS table_name,
    COUNT(*) AS row_count
FROM public.users
UNION ALL
SELECT 'locations', COUNT(*) FROM public.locations
UNION ALL
SELECT 'lists', COUNT(*) FROM public.lists
UNION ALL
SELECT 'items', COUNT(*) FROM public.items
UNION ALL
SELECT 'shares', COUNT(*) FROM public.shares
UNION ALL
SELECT 'location_members', COUNT(*) FROM public.location_members
ORDER BY table_name;

-- Check foreign key constraints
SELECT 'Foreign Keys Check' AS verification_step;
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✓ Present' AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Check unique constraints
SELECT 'Unique Constraints Check' AS verification_step;
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    '✓ Present' AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Check check constraints
SELECT 'Check Constraints' AS verification_step;
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause,
    '✓ Present' AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Final summary
SELECT 'Schema Verification Complete' AS message,
       'Run this query to verify all components are properly installed' AS note;
