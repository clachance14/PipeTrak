-- Performance Testing for Enhanced Milestone System
-- Run with: psql -d your_database -f performance-tests.sql

\timing on

-- Test setup with larger dataset
DO $$ 
DECLARE
    org_id TEXT := 'perf-org-1';
    user_id TEXT := 'perf-user-1';
    project_id TEXT := 'perf-project-1';
    template_id TEXT := 'perf-template-1';
    i INTEGER;
    j INTEGER;
    component_id TEXT;
    milestone_id TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTERVAL;
BEGIN
    -- Setup test organization and user
    INSERT INTO "Organization" (id, name, slug) VALUES (org_id, 'Performance Test Org', 'perf-test-org')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO "User" (id, name, email, "emailVerified", "createdAt", "updatedAt") 
    VALUES (user_id, 'Performance User', 'perf@test.com', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO "Member" (id, "userId", "organizationId", role) 
    VALUES ('perf-member-1', user_id, org_id, 'owner')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO "Project" (id, "organizationId", "jobName", "jobNumber", description, "createdBy", "createdAt", "updatedAt") 
    VALUES (project_id, org_id, 'Performance Test Project', 'PERF001', 'Large scale milestone testing', user_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO "Drawing" (id, "projectId", number, title, "createdAt", "updatedAt") 
    VALUES ('perf-drawing-1', project_id, 'PERF-D001', 'Performance Drawing', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO "MilestoneTemplate" (id, "projectId", name, milestones, "createdAt", "updatedAt") 
    VALUES (template_id, project_id, 'Performance Template', '[
      {"name": "Receive", "weight": 10, "order": 0},
      {"name": "Fabricate", "weight": 20, "order": 1},
      {"name": "Install", "weight": 30, "order": 2},
      {"name": "Test", "weight": 25, "order": 3},
      {"name": "Commission", "weight": 15, "order": 4}
    ]'::jsonb, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Creating 1000 components with 5000 milestones...';
    start_time := clock_timestamp();
    
    -- Create 1000 components (simulating large project)
    FOR i IN 1..1000 LOOP
        component_id := 'perf-component-' || i;
        
        INSERT INTO "Component" (
            id, "projectId", "drawingId", "milestoneTemplateId", "componentId", 
            "type", "workflowType", "status", "completionPercent", 
            "createdAt", "updatedAt"
        ) VALUES (
            component_id, project_id, 'perf-drawing-1', template_id, 'PERF-COMP-' || LPAD(i::TEXT, 4, '0'), 
            CASE (i % 3) WHEN 0 THEN 'VALVE' WHEN 1 THEN 'PIPE' ELSE 'FITTING' END,
            CASE (i % 3) WHEN 0 THEN 'MILESTONE_DISCRETE' WHEN 1 THEN 'MILESTONE_PERCENTAGE' ELSE 'MILESTONE_QUANTITY' END,
            'NOT_STARTED', 0, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Create 5 milestones per component
        FOR j IN 0..4 LOOP
            milestone_id := 'perf-milestone-' || i || '-' || j;
            
            INSERT INTO "ComponentMilestone" (
                id, "componentId", "milestoneName", "milestoneOrder", weight,
                "isCompleted", "percentageComplete", "quantityComplete", "quantityTotal",
                "createdAt", "updatedAt"
            ) VALUES (
                milestone_id, component_id, 
                CASE j WHEN 0 THEN 'Receive' WHEN 1 THEN 'Fabricate' WHEN 2 THEN 'Install' WHEN 3 THEN 'Test' ELSE 'Commission' END,
                j, 
                CASE j WHEN 0 THEN 10 WHEN 1 THEN 20 WHEN 2 THEN 30 WHEN 3 THEN 25 ELSE 15 END,
                false, 
                CASE WHEN (i % 3) = 1 THEN 0 ELSE NULL END,
                CASE WHEN (i % 3) = 2 THEN 0 ELSE NULL END,
                CASE WHEN (i % 3) = 2 THEN 100 ELSE NULL END,
                NOW(), NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        END LOOP;
        
        -- Progress indicator
        IF i % 100 = 0 THEN
            RAISE NOTICE 'Created % components...', i;
        END IF;
    END LOOP;
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    RAISE NOTICE 'Data creation completed in %', execution_time;
END $$;

-- Performance Test 1: Single component completion calculation
\echo '=== Performance Test 1: Single Component Completion Calculation ==='
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM calculate_component_completion('perf-component-500');

-- Performance Test 2: Batch component completion updates (10 components)
\echo '=== Performance Test 2: Batch Component Completion (10 components) ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM update_components_completion(
    ARRAY['perf-component-1', 'perf-component-2', 'perf-component-3', 'perf-component-4', 'perf-component-5',
          'perf-component-6', 'perf-component-7', 'perf-component-8', 'perf-component-9', 'perf-component-10']
);

-- Performance Test 3: Batch component completion updates (100 components)
\echo '=== Performance Test 3: Batch Component Completion (100 components) ==='
DO $$
DECLARE
    component_array TEXT[];
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    i INTEGER;
BEGIN
    -- Build array of 100 component IDs
    component_array := ARRAY[]::TEXT[];
    FOR i IN 1..100 LOOP
        component_array := array_append(component_array, 'perf-component-' || i);
    END LOOP;
    
    start_time := clock_timestamp();
    PERFORM update_components_completion(component_array);
    end_time := clock_timestamp();
    
    RAISE NOTICE 'Batch update of 100 components completed in %', (end_time - start_time);
END $$;

-- Performance Test 4: Bulk milestone updates via RPC (50 updates)
\echo '=== Performance Test 4: RPC Bulk Milestone Updates (50 updates) ==='
DO $$
DECLARE
    updates_json JSONB;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    result_count INTEGER;
BEGIN
    -- Build JSON array of updates
    updates_json := '[';
    FOR i IN 1..50 LOOP
        IF i > 1 THEN
            updates_json := updates_json || ',';
        END IF;
        updates_json := updates_json || jsonb_build_object(
            'componentId', 'perf-component-' || i,
            'milestoneName', 'Receive',
            'isCompleted', true
        );
    END LOOP;
    updates_json := updates_json || ']';
    
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO result_count 
    FROM batch_update_milestones(updates_json, 'perf-user-1', 'perf-batch-test-1')
    WHERE success = true;
    end_time := clock_timestamp();
    
    RAISE NOTICE 'RPC bulk update of 50 milestones completed in % (% successful)', (end_time - start_time), result_count;
END $$;

-- Performance Test 5: Complex milestone queries with joins
\echo '=== Performance Test 5: Complex Milestone Queries ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    c."componentId",
    c."type",
    c."workflowType",
    c."completionPercent",
    COUNT(cm.id) as total_milestones,
    COUNT(CASE WHEN cm."isCompleted" = true THEN 1 END) as completed_milestones,
    AVG(COALESCE(cm."percentageComplete", 0)) as avg_percentage,
    MAX(cm."completedAt") as last_completion
FROM "Component" c
JOIN "ComponentMilestone" cm ON c.id = cm."componentId"
WHERE c."projectId" = 'perf-project-1'
GROUP BY c.id, c."componentId", c."type", c."workflowType", c."completionPercent"
ORDER BY c."componentId"
LIMIT 100;

-- Performance Test 6: Audit log queries for recent updates
\echo '=== Performance Test 6: Audit Log Recent Updates Query ==='
-- First create some audit log entries
INSERT INTO "AuditLog" (
    id, "projectId", "userId", "entityType", "entityId", action, changes, "createdAt", "updatedAt"
)
SELECT 
    'perf-audit-' || generate_series,
    'perf-project-1',
    'perf-user-1',
    'component_milestone',
    'perf-milestone-' || generate_series || '-0',
    'UPDATE',
    '{"isCompleted": {"old": false, "new": true}}'::jsonb,
    NOW() - (random() * interval '7 days'),
    NOW()
FROM generate_series(1, 1000);

EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    al.*,
    cm."componentId",
    cm."milestoneName",
    c."componentId" as component_code
FROM "AuditLog" al
LEFT JOIN "ComponentMilestone" cm ON al."entityId" = cm.id
LEFT JOIN "Component" c ON cm."componentId" = c.id
WHERE al."projectId" = 'perf-project-1'
  AND al."entityType" = 'component_milestone'
  AND al.action = 'UPDATE'
ORDER BY al."createdAt" DESC
LIMIT 50;

-- Performance Test 7: Project summary materialized view refresh
\echo '=== Performance Test 7: Materialized View Refresh ==='
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_milestone_summary;
    end_time := clock_timestamp();
    
    RAISE NOTICE 'Materialized view refresh completed in %', (end_time - start_time);
END $$;

-- Performance Test 8: Index effectiveness check
\echo '=== Performance Test 8: Index Effectiveness ==='

-- Test component milestone lookup by component ID
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "ComponentMilestone" WHERE "componentId" = 'perf-component-500';

-- Test completed milestone lookup
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "ComponentMilestone" 
WHERE "completedAt" IS NOT NULL 
ORDER BY "completedAt" DESC 
LIMIT 20;

-- Test audit log project filtering
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "AuditLog" 
WHERE "projectId" = 'perf-project-1' 
  AND "entityType" = 'component_milestone' 
ORDER BY "createdAt" DESC 
LIMIT 50;

-- Performance Test 9: Concurrent update simulation
\echo '=== Performance Test 9: Concurrent Updates Simulation ==='
DO $$
DECLARE
    i INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    updates_json JSONB;
BEGIN
    start_time := clock_timestamp();
    
    -- Simulate 5 concurrent batch updates
    FOR i IN 1..5 LOOP
        updates_json := '[';
        FOR j IN 1..20 LOOP
            IF j > 1 THEN
                updates_json := updates_json || ',';
            END IF;
            updates_json := updates_json || jsonb_build_object(
                'componentId', 'perf-component-' || ((i-1)*20 + j),
                'milestoneName', 'Install',
                'percentageValue', 50 + (j * 2)
            );
        END LOOP;
        updates_json := updates_json || ']';
        
        PERFORM batch_update_milestones(updates_json, 'perf-user-1', 'perf-concurrent-' || i);
    END LOOP;
    
    end_time := clock_timestamp();
    RAISE NOTICE '5 concurrent batches of 20 updates each completed in %', (end_time - start_time);
END $$;

-- Performance Test 10: Memory usage and query plan analysis
\echo '=== Performance Test 10: Query Plans and Statistics ==='

-- Analyze table statistics
ANALYZE "Component";
ANALYZE "ComponentMilestone";
ANALYZE "AuditLog";
ANALYZE "BulkOperationTransaction";

-- Show table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals
FROM pg_stats 
WHERE tablename IN ('Component', 'ComponentMilestone', 'AuditLog')
  AND schemaname = 'public'
ORDER BY tablename, attname;

-- Show index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('Component', 'ComponentMilestone', 'AuditLog')
ORDER BY idx_scan DESC;

-- Performance Summary and Recommendations
\echo '=== Performance Summary ==='
DO $$
DECLARE
    component_count INTEGER;
    milestone_count INTEGER;
    audit_count INTEGER;
    avg_completion NUMERIC;
BEGIN
    SELECT COUNT(*) INTO component_count FROM "Component" WHERE "projectId" = 'perf-project-1';
    SELECT COUNT(*) INTO milestone_count FROM "ComponentMilestone" cm 
    JOIN "Component" c ON cm."componentId" = c.id 
    WHERE c."projectId" = 'perf-project-1';
    SELECT COUNT(*) INTO audit_count FROM "AuditLog" WHERE "projectId" = 'perf-project-1';
    SELECT AVG("completionPercent") INTO avg_completion FROM "Component" WHERE "projectId" = 'perf-project-1';
    
    RAISE NOTICE 'Performance Test Dataset Summary:';
    RAISE NOTICE '  Components: %', component_count;
    RAISE NOTICE '  Milestones: %', milestone_count;
    RAISE NOTICE '  Audit Logs: %', audit_count;
    RAISE NOTICE '  Average Completion: %%%', ROUND(avg_completion, 2);
    
    RAISE NOTICE 'Performance Recommendations:';
    RAISE NOTICE '  1. Ensure all indexes are being used effectively';
    RAISE NOTICE '  2. Consider partitioning audit log table if > 1M records';
    RAISE NOTICE '  3. Refresh materialized views during low-traffic periods';
    RAISE NOTICE '  4. Monitor RPC function performance with batch sizes > 100';
    RAISE NOTICE '  5. Use connection pooling for concurrent operations';
END $$;

-- Cleanup performance test data
\echo '=== Cleaning up performance test data ==='
DELETE FROM "ComponentMilestone" cm 
USING "Component" c 
WHERE cm."componentId" = c.id 
  AND c."projectId" = 'perf-project-1';

DELETE FROM "Component" WHERE "projectId" = 'perf-project-1';
DELETE FROM "AuditLog" WHERE "projectId" = 'perf-project-1';
DELETE FROM "BulkOperationTransaction" WHERE "projectId" = 'perf-project-1';
DELETE FROM "MilestoneTemplate" WHERE "projectId" = 'perf-project-1';
DELETE FROM "Drawing" WHERE "projectId" = 'perf-project-1';
DELETE FROM "Project" WHERE id = 'perf-project-1';
DELETE FROM "Member" WHERE "userId" = 'perf-user-1';
DELETE FROM "User" WHERE id = 'perf-user-1';
DELETE FROM "Organization" WHERE id = 'perf-org-1';

\timing off
\echo 'Performance testing completed.'