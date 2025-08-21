-- Comprehensive Dashboard RPC Function Tests
-- Purpose: Verify dashboard functions with pgTAP framework
-- Coverage: All RPC functions, edge cases, performance benchmarks

BEGIN;
SELECT plan(50); -- Total number of tests

-- Test setup: Create isolated test data
DO $$
DECLARE
    test_org_id TEXT := 'test-org-dashboard-' || generate_random_uuid();
    test_project_id TEXT := 'test-proj-dashboard-' || generate_random_uuid();
    test_user_id TEXT := 'test-user-dashboard-' || generate_random_uuid();
    test_template_id TEXT := 'test-template-' || generate_random_uuid();
    result_metrics JSONB;
    result_matrix JSONB;
    result_drawings JSONB;
    result_packages JSONB;
    result_activity JSONB;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time_ms NUMERIC;
BEGIN
    -- Create test organization
    INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt")
    VALUES (test_org_id, 'Test Dashboard Org', 'test-dashboard-org', NOW(), NOW());
    
    -- Create test user
    INSERT INTO "User" (id, email, name, "emailVerified", "createdAt", "updatedAt")
    VALUES (test_user_id, 'dashboard@test.com', 'Dashboard Tester', NOW(), NOW(), NOW());
    
    -- Create membership
    INSERT INTO "Member" (id, role, "userId", "organizationId", "createdAt", "updatedAt")
    VALUES (generate_random_uuid(), 'owner', test_user_id, test_org_id, NOW(), NOW());
    
    -- Create test project
    INSERT INTO "Project" (id, "jobName", description, status, "organizationId", "createdAt", "updatedAt")
    VALUES (test_project_id, 'Dashboard Test Project', 'Test project for dashboard functions', 'ACTIVE', test_org_id, NOW(), NOW());
    
    -- Create milestone template
    INSERT INTO "MilestoneTemplate" (id, name, description, milestones, "createdAt", "updatedAt")
    VALUES (
        test_template_id, 
        'Dashboard Test Template', 
        'Template for dashboard testing',
        '[
            {"name": "Design Review", "order": 1, "weight": 1},
            {"name": "Material Procurement", "order": 2, "weight": 1},
            {"name": "Installation", "order": 3, "weight": 1},
            {"name": "Quality Check", "order": 4, "weight": 1},
            {"name": "Completion", "order": 5, "weight": 1}
        ]'::jsonb,
        NOW(), NOW()
    );
    
    RAISE NOTICE 'Created test data with project ID: %', test_project_id;
    
    -- Store test data in session for use in pgTAP tests
    PERFORM set_config('test.org_id', test_org_id, false);
    PERFORM set_config('test.project_id', test_project_id, false);
    PERFORM set_config('test.user_id', test_user_id, false);
    PERFORM set_config('test.template_id', test_template_id, false);
    
END;
$$;

-- Test 1: Dashboard Metrics Function Existence and Structure
SELECT has_function_privilege('get_dashboard_metrics(text)', 'execute');
SELECT is(
    (SELECT get_dashboard_metrics(current_setting('test.project_id'))::jsonb ? 'totalComponents'), 
    true, 
    'get_dashboard_metrics returns totalComponents field'
);
SELECT is(
    (SELECT get_dashboard_metrics(current_setting('test.project_id'))::jsonb ? 'overallCompletionPercent'), 
    true, 
    'get_dashboard_metrics returns overallCompletionPercent field'
);
SELECT is(
    (SELECT get_dashboard_metrics(current_setting('test.project_id'))::jsonb ? 'stalledComponents'), 
    true, 
    'get_dashboard_metrics returns stalledComponents field'
);

-- Test 2: Area/System Matrix Function
SELECT has_function_privilege('get_area_system_matrix(text)', 'execute');
SELECT is(
    (SELECT get_area_system_matrix(current_setting('test.project_id'))::jsonb ? 'matrixData'), 
    true, 
    'get_area_system_matrix returns matrixData field'
);
SELECT is(
    (SELECT jsonb_typeof(get_area_system_matrix(current_setting('test.project_id'))->'matrixData')), 
    'array', 
    'matrixData is an array'
);

-- Test 3: Drawing Rollups Function
SELECT has_function_privilege('get_drawing_rollups(text)', 'execute');
SELECT is(
    (SELECT get_drawing_rollups(current_setting('test.project_id'))::jsonb ? 'drawings'), 
    true, 
    'get_drawing_rollups returns drawings field'
);
SELECT is(
    (SELECT jsonb_typeof(get_drawing_rollups(current_setting('test.project_id'))->'drawings')), 
    'array', 
    'drawings is an array'
);

-- Test 4: Test Package Readiness Function
SELECT has_function_privilege('get_test_package_readiness(text)', 'execute');
SELECT is(
    (SELECT get_test_package_readiness(current_setting('test.project_id'))::jsonb ? 'testPackages'), 
    true, 
    'get_test_package_readiness returns testPackages field'
);
SELECT is(
    (SELECT jsonb_typeof(get_test_package_readiness(current_setting('test.project_id'))->'testPackages')), 
    'array', 
    'testPackages is an array'
);

-- Test 5: Recent Activity Function
SELECT has_function_privilege('get_recent_activity(text, integer)', 'execute');
SELECT is(
    (SELECT get_recent_activity(current_setting('test.project_id'), 10)::jsonb ? 'activities'), 
    true, 
    'get_recent_activity returns activities field'
);
SELECT is(
    (SELECT jsonb_typeof(get_recent_activity(current_setting('test.project_id'), 10)->'activities')), 
    'array', 
    'activities is an array'
);

-- Test with known test data
DO $$
DECLARE
    test_project_id TEXT := current_setting('test.project_id');
    test_template_id TEXT := current_setting('test.template_id');
    test_drawing_id TEXT;
    test_component_id TEXT;
    result_metrics JSONB;
    result_matrix JSONB;
    component_count INTEGER;
BEGIN
    -- Create test drawing
    test_drawing_id := 'test-drawing-' || generate_random_uuid();
    INSERT INTO "Drawing" (id, number, title, "projectId", "createdAt", "updatedAt")
    VALUES (test_drawing_id, 'TEST-DWG-001', 'Test Drawing for Dashboard', test_project_id, NOW(), NOW());
    
    -- Create test components with different states
    FOR i IN 1..87 LOOP
        test_component_id := 'test-comp-' || generate_random_uuid();
        
        INSERT INTO "Component" (
            id, "componentId", type, description, status, "completionPercent",
            "workflowType", "projectId", "milestoneTemplateId", "drawingId",
            area, system, "testPackage", "createdAt", "updatedAt"
        ) VALUES (
            test_component_id,
            'TEST-COMP-' || LPAD(i::text, 3, '0'),
            CASE i % 4
                WHEN 0 THEN 'Ball Valve'
                WHEN 1 THEN 'Gate Valve' 
                WHEN 2 THEN 'Pipe Section'
                ELSE 'Fitting'
            END,
            'Test component ' || i,
            CASE 
                WHEN i <= 60 THEN 'COMPLETED'
                WHEN i <= 80 THEN 'IN_PROGRESS'
                ELSE 'NOT_STARTED'
            END,
            CASE 
                WHEN i <= 60 THEN 100
                WHEN i <= 80 THEN 50
                ELSE 0
            END,
            'MILESTONE_DISCRETE',
            test_project_id,
            test_template_id,
            test_drawing_id,
            'Area-' || LPAD((i % 5 + 1)::text, 2, '0'),
            'System-' || LPAD((i % 8 + 1)::text, 2, '0'),
            'PKG-' || LPAD((i % 3 + 1)::text, 2, '0'),
            -- Stagger creation dates for stalled component testing
            NOW() - INTERVAL '1 day' * CASE 
                WHEN i > 84 THEN 25  -- 3 components stalled 21+ days
                WHEN i > 81 THEN 16  -- 3 components stalled 14-21 days
                WHEN i > 77 THEN 9   -- 4 components stalled 7-14 days
                ELSE 1               -- Rest created recently
            END,
            NOW()
        );
        
        -- Create milestones for each component
        INSERT INTO "ComponentMilestone" (
            id, "componentId", "milestoneName", "milestoneOrder",
            "isCompleted", "createdAt", "updatedAt"
        ) VALUES 
        (generate_random_uuid(), test_component_id, 'Design Review', 1, i <= 60, NOW(), NOW()),
        (generate_random_uuid(), test_component_id, 'Material Procurement', 2, i <= 60, NOW(), NOW()),
        (generate_random_uuid(), test_component_id, 'Installation', 3, i <= 60, NOW(), NOW()),
        (generate_random_uuid(), test_component_id, 'Quality Check', 4, i <= 60, NOW(), NOW()),
        (generate_random_uuid(), test_component_id, 'Completion', 5, i <= 60, NOW(), NOW());
    END LOOP;
    
    -- Update component completion based on milestones
    UPDATE "Component" SET "completionPercent" = (
        SELECT (COUNT(*) FILTER (WHERE "isCompleted") * 100.0 / COUNT(*))::integer
        FROM "ComponentMilestone" cm
        WHERE cm."componentId" = "Component".id
    ) WHERE "projectId" = test_project_id;
    
    -- Store component count for validation
    PERFORM set_config('test.component_count', '87', false);
    
    RAISE NOTICE 'Created 87 test components with various completion states';
END;
$$;

-- Test 6: Dashboard Metrics with Known Data (87 components)
SELECT is(
    (SELECT (get_dashboard_metrics(current_setting('test.project_id'))->>'totalComponents')::integer),
    87,
    'Dashboard metrics shows correct total component count'
);

SELECT is(
    (SELECT (get_dashboard_metrics(current_setting('test.project_id'))->>'completedComponents')::integer),
    60,
    'Dashboard metrics shows correct completed component count'
);

SELECT is(
    (SELECT (get_dashboard_metrics(current_setting('test.project_id'))->>'overallCompletionPercent')::numeric),
    69.0,
    'Dashboard metrics calculates correct completion percentage'
);

-- Test 7: Stalled Component Calculations
SELECT is(
    (SELECT (get_dashboard_metrics(current_setting('test.project_id'))->'stalledComponents'->>'stalled7Days')::integer),
    4,
    'Dashboard metrics correctly identifies components stalled 7+ days'
);

SELECT is(
    (SELECT (get_dashboard_metrics(current_setting('test.project_id'))->'stalledComponents'->>'stalled14Days')::integer),
    3,
    'Dashboard metrics correctly identifies components stalled 14+ days'
);

SELECT is(
    (SELECT (get_dashboard_metrics(current_setting('test.project_id'))->'stalledComponents'->>'stalled21Days')::integer),
    3,
    'Dashboard metrics correctly identifies components stalled 21+ days'
);

-- Test 8: Area/System Matrix Calculations
SELECT cmp_ok(
    (SELECT jsonb_array_length(get_area_system_matrix(current_setting('test.project_id'))->'matrixData')),
    '>=',
    1,
    'Area/System matrix contains matrix entries'
);

-- Test 9: Test Package Readiness
SELECT is(
    (SELECT jsonb_array_length(get_test_package_readiness(current_setting('test.project_id'))->'testPackages')),
    3,
    'Test package readiness returns correct number of packages'
);

-- Test 10: Performance Benchmarks (<100ms target)
DO $$
DECLARE
    test_project_id TEXT := current_setting('test.project_id');
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time_ms NUMERIC;
BEGIN
    -- Test get_dashboard_metrics performance
    start_time := clock_timestamp();
    PERFORM get_dashboard_metrics(test_project_id);
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(milliseconds FROM end_time - start_time);
    
    -- Use pgTAP test for performance assertion
    PERFORM ok(execution_time_ms < 100, 'get_dashboard_metrics executes under 100ms (' || execution_time_ms::text || 'ms)');
    
    -- Test get_area_system_matrix performance
    start_time := clock_timestamp();
    PERFORM get_area_system_matrix(test_project_id);
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(milliseconds FROM end_time - start_time);
    PERFORM ok(execution_time_ms < 100, 'get_area_system_matrix executes under 100ms (' || execution_time_ms::text || 'ms)');
    
    -- Test get_drawing_rollups performance
    start_time := clock_timestamp();
    PERFORM get_drawing_rollups(test_project_id);
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(milliseconds FROM end_time - start_time);
    PERFORM ok(execution_time_ms < 100, 'get_drawing_rollups executes under 100ms (' || execution_time_ms::text || 'ms)');
    
    -- Test get_test_package_readiness performance
    start_time := clock_timestamp();
    PERFORM get_test_package_readiness(test_project_id);
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(milliseconds FROM end_time - start_time);
    PERFORM ok(execution_time_ms < 100, 'get_test_package_readiness executes under 100ms (' || execution_time_ms::text || 'ms)');
    
    -- Test get_recent_activity performance
    start_time := clock_timestamp();
    PERFORM get_recent_activity(test_project_id, 50);
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(milliseconds FROM end_time - start_time);
    PERFORM ok(execution_time_ms < 100, 'get_recent_activity executes under 100ms (' || execution_time_ms::text || 'ms)');
END;
$$;

-- Test 11: Edge Cases - Empty Project
DO $$
DECLARE
    empty_project_id TEXT := 'empty-project-' || generate_random_uuid();
    test_org_id TEXT := current_setting('test.org_id');
    result JSONB;
BEGIN
    -- Create empty project
    INSERT INTO "Project" (id, "jobName", description, status, "organizationId", "createdAt", "updatedAt")
    VALUES (empty_project_id, 'Empty Test Project', 'Project with no components', 'ACTIVE', test_org_id, NOW(), NOW());
    
    -- Test metrics with empty project
    SELECT get_dashboard_metrics(empty_project_id) INTO result;
    PERFORM is((result->>'totalComponents')::integer, 0, 'Empty project returns zero components');
    PERFORM is((result->>'overallCompletionPercent')::numeric, 0.0, 'Empty project returns 0% completion');
    
    -- Test matrix with empty project
    SELECT get_area_system_matrix(empty_project_id) INTO result;
    PERFORM is(jsonb_array_length(result->'matrixData'), 0, 'Empty project returns empty matrix');
END;
$$;

-- Test 12: Null Input Handling
SELECT is(
    get_dashboard_metrics(NULL),
    '{"error": "Project ID is required"}'::jsonb,
    'Dashboard metrics handles null project ID gracefully'
);

SELECT is(
    get_area_system_matrix(NULL),
    '{"error": "Project ID is required"}'::jsonb,
    'Area system matrix handles null project ID gracefully'
);

-- Test 13: Non-existent Project ID
SELECT is(
    (get_dashboard_metrics('non-existent-project') ? 'error'),
    true,
    'Dashboard metrics handles non-existent project ID'
);

-- Test 14: Large Dataset Performance (10k components simulation)
DO $$
DECLARE
    perf_project_id TEXT := 'perf-project-' || generate_random_uuid();
    test_org_id TEXT := current_setting('test.org_id');
    test_template_id TEXT := current_setting('test.template_id');
    test_drawing_id TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time_ms NUMERIC;
BEGIN
    -- Create performance test project
    INSERT INTO "Project" (id, "jobName", description, status, "organizationId", "createdAt", "updatedAt")
    VALUES (perf_project_id, 'Performance Test Project', 'Large dataset test', 'ACTIVE', test_org_id, NOW(), NOW());
    
    -- Create drawing
    test_drawing_id := 'perf-drawing-' || generate_random_uuid();
    INSERT INTO "Drawing" (id, number, title, "projectId", "createdAt", "updatedAt")
    VALUES (test_drawing_id, 'PERF-DWG-001', 'Performance Test Drawing', perf_project_id, NOW(), NOW());
    
    -- Create components in batches for performance testing (simulate 10k)
    -- We'll create fewer for testing but structure to simulate larger dataset impact
    FOR i IN 1..500 LOOP  -- Reduced for practical testing
        INSERT INTO "Component" (
            id, "componentId", type, description, status, "completionPercent",
            "workflowType", "projectId", "milestoneTemplateId", "drawingId",
            area, system, "testPackage", "createdAt", "updatedAt"
        ) VALUES (
            'perf-comp-' || i::text,
            'PERF-COMP-' || LPAD(i::text, 6, '0'),
            'Performance Component',
            'Large dataset test component',
            CASE WHEN i % 3 = 0 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            CASE WHEN i % 3 = 0 THEN 100 ELSE 50 END,
            'MILESTONE_DISCRETE',
            perf_project_id,
            test_template_id,
            test_drawing_id,
            'AREA-' || LPAD((i % 10 + 1)::text, 2, '0'),
            'SYS-' || LPAD((i % 20 + 1)::text, 2, '0'),
            'PKG-' || LPAD((i % 5 + 1)::text, 2, '0'),
            NOW(),
            NOW()
        );
    END LOOP;
    
    -- Test performance with larger dataset
    start_time := clock_timestamp();
    PERFORM get_dashboard_metrics(perf_project_id);
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(milliseconds FROM end_time - start_time);
    PERFORM ok(execution_time_ms < 500, 'Dashboard metrics with 500 components under 500ms (' || execution_time_ms::text || 'ms)');
    
    -- Test area/system matrix performance
    start_time := clock_timestamp();
    PERFORM get_area_system_matrix(perf_project_id);
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(milliseconds FROM end_time - start_time);
    PERFORM ok(execution_time_ms < 500, 'Area/system matrix with 500 components under 500ms (' || execution_time_ms::text || 'ms)');
END;
$$;

-- Test 15: Data Integrity Validation
DO $$
DECLARE
    test_project_id TEXT := current_setting('test.project_id');
    component_count INTEGER;
    milestone_count INTEGER;
    package_count INTEGER;
BEGIN
    -- Validate test data integrity
    SELECT COUNT(*) INTO component_count 
    FROM "Component" WHERE "projectId" = test_project_id;
    
    SELECT COUNT(*) INTO milestone_count 
    FROM "ComponentMilestone" cm
    JOIN "Component" c ON cm."componentId" = c.id
    WHERE c."projectId" = test_project_id;
    
    SELECT COUNT(DISTINCT "testPackage") INTO package_count
    FROM "Component" 
    WHERE "projectId" = test_project_id AND "testPackage" IS NOT NULL;
    
    PERFORM is(component_count, 87, 'Test data contains expected component count');
    PERFORM is(milestone_count, 435, 'Test data contains expected milestone count (87 * 5)');
    PERFORM is(package_count, 3, 'Test data contains expected package count');
END;
$$;

-- Cleanup test data
DO $$
DECLARE
    test_org_id TEXT := current_setting('test.org_id');
    test_project_id TEXT := current_setting('test.project_id');
    test_user_id TEXT := current_setting('test.user_id');
BEGIN
    -- Clean up in reverse order of creation
    DELETE FROM "ComponentMilestone" WHERE "componentId" IN (
        SELECT id FROM "Component" WHERE "projectId" IN (
            SELECT id FROM "Project" WHERE "organizationId" = test_org_id
        )
    );
    DELETE FROM "Component" WHERE "projectId" IN (
        SELECT id FROM "Project" WHERE "organizationId" = test_org_id
    );
    DELETE FROM "Drawing" WHERE "projectId" IN (
        SELECT id FROM "Project" WHERE "organizationId" = test_org_id
    );
    DELETE FROM "Project" WHERE "organizationId" = test_org_id;
    DELETE FROM "MilestoneTemplate" WHERE id = current_setting('test.template_id');
    DELETE FROM "Member" WHERE "userId" = test_user_id;
    DELETE FROM "User" WHERE id = test_user_id;
    DELETE FROM "Organization" WHERE id = test_org_id;
END;
$$;

SELECT * FROM finish();