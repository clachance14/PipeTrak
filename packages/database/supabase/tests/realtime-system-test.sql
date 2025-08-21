-- Test script for Realtime Subscriptions System
-- Run this to verify the realtime implementation is working correctly

-- Test 1: Verify realtime is enabled on required tables
DO $$
DECLARE
    table_name text;
    has_realtime boolean;
BEGIN
    RAISE NOTICE 'Testing realtime configuration...';
    
    -- Check each required table
    FOR table_name IN 
        SELECT unnest(ARRAY['Component', 'ComponentMilestone', 'Drawing', 'ImportJob', 'Project', 'AuditLog'])
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = table_name
        ) INTO has_realtime;
        
        IF has_realtime THEN
            RAISE NOTICE '✓ Table % has realtime enabled', table_name;
        ELSE
            RAISE WARNING '✗ Table % does NOT have realtime enabled', table_name;
        END IF;
    END LOOP;
END
$$;

-- Test 2: Verify realtime performance indexes exist
DO $$
DECLARE
    index_name text;
    index_exists boolean;
BEGIN
    RAISE NOTICE 'Testing realtime performance indexes...';
    
    -- Check required indexes
    FOR index_name IN 
        SELECT unnest(ARRAY[
            'idx_component_realtime',
            'idx_milestone_realtime', 
            'idx_drawing_realtime',
            'idx_import_realtime',
            'idx_audit_realtime'
        ])
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'i' 
            AND c.relname = index_name
            AND n.nspname = 'public'
        ) INTO index_exists;
        
        IF index_exists THEN
            RAISE NOTICE '✓ Index % exists', index_name;
        ELSE
            RAISE WARNING '✗ Index % does NOT exist', index_name;
        END IF;
    END LOOP;
END
$$;

-- Test 3: Verify PostgreSQL functions exist
DO $$
DECLARE
    func_name text;
    func_exists boolean;
BEGIN
    RAISE NOTICE 'Testing PostgreSQL functions...';
    
    FOR func_name IN 
        SELECT unnest(ARRAY[
            'check_realtime_access',
            'get_active_project_users',
            'broadcast_project_event',
            'notify_audit_change',
            'notify_component_change',
            'notify_milestone_change',
            'notify_import_change'
        ])
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE p.proname = func_name
            AND n.nspname = 'public'
        ) INTO func_exists;
        
        IF func_exists THEN
            RAISE NOTICE '✓ Function %() exists', func_name;
        ELSE
            RAISE WARNING '✗ Function %() does NOT exist', func_name;
        END IF;
    END LOOP;
END
$$;

-- Test 4: Verify triggers exist
DO $$
DECLARE
    trigger_name text;
    table_name text;
    trigger_exists boolean;
BEGIN
    RAISE NOTICE 'Testing trigger functions...';
    
    -- Check triggers on specific tables
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'audit_log_notify'
        AND c.relname = 'AuditLog'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✓ Trigger audit_log_notify exists on AuditLog table';
    ELSE
        RAISE WARNING '✗ Trigger audit_log_notify does NOT exist on AuditLog table';
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'component_change_notify'
        AND c.relname = 'Component'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✓ Trigger component_change_notify exists on Component table';
    ELSE
        RAISE WARNING '✗ Trigger component_change_notify does NOT exist on Component table';
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'milestone_change_notify'
        AND c.relname = 'ComponentMilestone'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✓ Trigger milestone_change_notify exists on ComponentMilestone table';
    ELSE
        RAISE WARNING '✗ Trigger milestone_change_notify does NOT exist on ComponentMilestone table';
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'import_job_notify'
        AND c.relname = 'ImportJob'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✓ Trigger import_job_notify exists on ImportJob table';
    ELSE
        RAISE WARNING '✗ Trigger import_job_notify does NOT exist on ImportJob table';
    END IF;
END
$$;

-- Test 5: Test function permissions
DO $$
DECLARE
    test_user_id text := 'test-user-123';
    test_project_id text := 'test-project-456';
    access_result boolean;
BEGIN
    RAISE NOTICE 'Testing function permissions...';
    
    -- Test check_realtime_access function (should return false for non-existent data)
    BEGIN
        SELECT check_realtime_access(test_project_id, test_user_id) INTO access_result;
        RAISE NOTICE '✓ check_realtime_access() function callable - returned %', access_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '✗ check_realtime_access() function failed: %', SQLERRM;
    END;
    
    -- Test get_active_project_users function
    BEGIN
        PERFORM * FROM get_active_project_users(test_project_id) LIMIT 1;
        RAISE NOTICE '✓ get_active_project_users() function callable';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '✗ get_active_project_users() function failed: %', SQLERRM;
    END;
    
    -- Test broadcast_project_event function
    BEGIN
        PERFORM broadcast_project_event();
        RAISE NOTICE '✓ broadcast_project_event() function callable';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '✗ broadcast_project_event() function failed: %', SQLERRM;
    END;
END
$$;

-- Test 6: Check table structure for realtime compatibility
DO $$
DECLARE
    missing_columns text[] := ARRAY[]::text[];
BEGIN
    RAISE NOTICE 'Testing table structure for realtime compatibility...';
    
    -- Check Component table has required columns
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Component' 
                  AND column_name = 'updatedAt') THEN
        missing_columns := array_append(missing_columns, 'Component.updatedAt');
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Component' 
                  AND column_name = 'projectId') THEN
        missing_columns := array_append(missing_columns, 'Component.projectId');
    END IF;
    
    -- Check ComponentMilestone table has required columns
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'ComponentMilestone' 
                  AND column_name = 'updatedAt') THEN
        missing_columns := array_append(missing_columns, 'ComponentMilestone.updatedAt');
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'ComponentMilestone' 
                  AND column_name = 'isCompleted') THEN
        missing_columns := array_append(missing_columns, 'ComponentMilestone.isCompleted');
    END IF;
    
    -- Check ImportJob table has required columns
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'ImportJob' 
                  AND column_name = 'status') THEN
        missing_columns := array_append(missing_columns, 'ImportJob.status');
    END IF;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING '✗ Missing columns for realtime: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✓ All required columns present for realtime';
    END IF;
END
$$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== REALTIME SYSTEM TEST COMPLETE ===';
    RAISE NOTICE 'Review the output above for any warnings or errors.';
    RAISE NOTICE 'All ✓ items indicate successful configuration.';
    RAISE NOTICE 'Any ✗ items need to be addressed before realtime will work properly.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Ensure Supabase Realtime is enabled in project settings';
    RAISE NOTICE '2. Test API endpoints: GET /api/pipetrak/realtime/health';
    RAISE NOTICE '3. Test frontend hooks with browser dev tools';
    RAISE NOTICE '4. Monitor realtime events in Supabase dashboard';
END
$$;