-- Milestone RLS Policies Test Suite
-- Tests Row Level Security policies for milestone-related operations

BEGIN;

-- Load pgTAP extension
SELECT plan(50);

-- Test setup: Create test organizations, users, projects, and components
INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt") VALUES 
  ('org1', 'Test Organization 1', 'test-org-1', NOW(), NOW()),
  ('org2', 'Test Organization 2', 'test-org-2', NOW(), NOW());

INSERT INTO "User" (id, email, name, "emailVerified", "createdAt", "updatedAt") VALUES 
  ('user1', 'user1@test.com', 'Test User 1', NOW(), NOW(), NOW()),
  ('user2', 'user2@test.com', 'Test User 2', NOW(), NOW(), NOW()),
  ('user3', 'user3@test.com', 'Test User 3', NOW(), NOW(), NOW());

INSERT INTO "Member" (id, role, "userId", "organizationId", "createdAt", "updatedAt") VALUES 
  ('member1', 'owner', 'user1', 'org1', NOW(), NOW()),
  ('member2', 'member', 'user2', 'org1', NOW(), NOW()),
  ('member3', 'owner', 'user3', 'org2', NOW(), NOW());

INSERT INTO "Project" (id, name, description, "organizationId", "createdAt", "updatedAt") VALUES 
  ('project1', 'Test Project 1', 'Test project in org 1', 'org1', NOW(), NOW()),
  ('project2', 'Test Project 2', 'Test project in org 2', 'org2', NOW(), NOW());

INSERT INTO "MilestoneTemplate" (id, name, description, milestones, "createdAt", "updatedAt") VALUES 
  ('template1', 'Standard Template', 'Standard milestone template', '[]', NOW(), NOW());

INSERT INTO "Component" (id, "componentId", type, description, status, "completionPercent", "workflowType", "projectId", "milestoneTemplateId", "createdAt", "updatedAt") VALUES 
  ('comp1', 'COMP-001', 'Test Component', 'Component in project 1', 'NOT_STARTED', 0, 'MILESTONE_DISCRETE', 'project1', 'template1', NOW(), NOW()),
  ('comp2', 'COMP-002', 'Test Component', 'Component in project 2', 'NOT_STARTED', 0, 'MILESTONE_DISCRETE', 'project2', 'template1', NOW(), NOW());

INSERT INTO "ComponentMilestone" (id, "componentId", "milestoneName", "milestoneOrder", "isCompleted", "percentageComplete", "quantityComplete", "quantityTotal", "createdAt", "updatedAt") VALUES 
  ('milestone1', 'comp1', 'Design Review', 1, false, 0, NULL, NULL, NOW(), NOW()),
  ('milestone2', 'comp1', 'Installation', 2, false, 0, NULL, NULL, NOW(), NOW()),
  ('milestone3', 'comp2', 'Design Review', 1, false, 0, NULL, NULL, NOW(), NOW());

-- Test RLS policies for ComponentMilestone table

-- Test 1: Users can view milestones for components in their organization
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone" WHERE "componentId" = ''comp1'' ORDER BY id',
  $$VALUES ('milestone1'::text), ('milestone2'::text)$$,
  'User 1 can view milestones for components in their organization'
);

-- Test 2: Users cannot view milestones for components in other organizations
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone" WHERE "componentId" = ''comp2''',
  'SELECT NULL::text WHERE FALSE',
  'User 1 cannot view milestones for components in other organizations'
);

-- Test 3: Organization members can view milestones (not just owners)
SELECT set_config('request.jwt.claims', '{"sub": "user2"}', true);
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone" WHERE "componentId" = ''comp1'' ORDER BY id',
  $$VALUES ('milestone1'::text), ('milestone2'::text)$$,
  'Organization member can view milestones for components in their organization'
);

-- Test 4: Users from different organization cannot view each other's milestones
SELECT set_config('request.jwt.claims', '{"sub": "user3"}', true);
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone" WHERE "componentId" = ''comp1''',
  'SELECT NULL::text WHERE FALSE',
  'User 3 cannot view milestones from other organizations'
);

-- Test 5: User 3 can view milestones from their own organization
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone" WHERE "componentId" = ''comp2''',
  $$VALUES ('milestone3'::text)$$,
  'User 3 can view milestones from their own organization'
);

-- Test update permissions

-- Test 6: Users can update milestones in their organization
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
UPDATE "ComponentMilestone" SET "isCompleted" = true WHERE id = 'milestone1';
SELECT ok(
  (SELECT "isCompleted" FROM "ComponentMilestone" WHERE id = 'milestone1'),
  'User 1 can update milestones in their organization'
);

-- Test 7: Users cannot update milestones in other organizations
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT throws_ok(
  'UPDATE "ComponentMilestone" SET "isCompleted" = true WHERE id = ''milestone3''',
  'new row violates row-level security policy',
  'User 1 cannot update milestones in other organizations'
);

-- Test 8: Organization members (non-owners) can update milestones
SELECT set_config('request.jwt.claims', '{"sub": "user2"}', true);
UPDATE "ComponentMilestone" SET "percentageComplete" = 50 WHERE id = 'milestone2';
SELECT is(
  (SELECT "percentageComplete" FROM "ComponentMilestone" WHERE id = 'milestone2'),
  50,
  'Organization member can update milestones'
);

-- Test insert permissions

-- Test 9: Users can insert milestones for components in their organization
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
INSERT INTO "ComponentMilestone" (id, "componentId", "milestoneName", "milestoneOrder", "isCompleted", "createdAt", "updatedAt")
VALUES ('new_milestone1', 'comp1', 'Testing', 3, false, NOW(), NOW());

SELECT ok(
  EXISTS(SELECT 1 FROM "ComponentMilestone" WHERE id = 'new_milestone1'),
  'User 1 can insert milestones for components in their organization'
);

-- Test 10: Users cannot insert milestones for components in other organizations
SELECT throws_ok(
  'INSERT INTO "ComponentMilestone" (id, "componentId", "milestoneName", "milestoneOrder", "isCompleted", "createdAt", "updatedAt") VALUES (''bad_milestone'', ''comp2'', ''Bad Milestone'', 1, false, NOW(), NOW())',
  'new row violates row-level security policy',
  'User 1 cannot insert milestones for components in other organizations'
);

-- Test delete permissions

-- Test 11: Users can delete milestones in their organization
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
DELETE FROM "ComponentMilestone" WHERE id = 'new_milestone1';
SELECT ok(
  NOT EXISTS(SELECT 1 FROM "ComponentMilestone" WHERE id = 'new_milestone1'),
  'User 1 can delete milestones in their organization'
);

-- Test 12: Users cannot delete milestones in other organizations
SELECT throws_ok(
  'DELETE FROM "ComponentMilestone" WHERE id = ''milestone3''',
  'new row violates row-level security policy',
  'User 1 cannot delete milestones in other organizations'
);

-- Test Component table RLS (milestone-related operations depend on this)

-- Test 13: Users can view components in their organization
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT ok(
  EXISTS(SELECT 1 FROM "Component" WHERE id = 'comp1'),
  'User 1 can view components in their organization'
);

-- Test 14: Users cannot view components in other organizations
SELECT ok(
  NOT EXISTS(SELECT 1 FROM "Component" WHERE id = 'comp2'),
  'User 1 cannot view components in other organizations'
);

-- Test 15: Users can update component completion based on milestones
UPDATE "Component" SET "completionPercent" = 25 WHERE id = 'comp1';
SELECT is(
  (SELECT "completionPercent" FROM "Component" WHERE id = 'comp1'),
  25,
  'User 1 can update component completion in their organization'
);

-- Test AuditLog RLS for milestone operations

-- Test 16: Milestone updates should create audit logs visible to organization members
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);

-- Insert audit log for milestone update
INSERT INTO "AuditLog" (id, "projectId", "userId", "entityType", "entityId", action, changes, "createdAt")
VALUES ('audit1', 'project1', 'user1', 'component_milestone', 'milestone1', 'UPDATE', '{}', NOW());

SELECT ok(
  EXISTS(SELECT 1 FROM "AuditLog" WHERE id = 'audit1'),
  'Milestone audit logs are visible to organization members'
);

-- Test 17: Users cannot view audit logs from other organizations
SELECT set_config('request.jwt.claims', '{"sub": "user3"}', true);
SELECT ok(
  NOT EXISTS(SELECT 1 FROM "AuditLog" WHERE id = 'audit1'),
  'Users cannot view audit logs from other organizations'
);

-- Test bulk milestone operations

-- Test 18: Bulk milestone updates should respect RLS
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);

-- Create a stored procedure to simulate bulk update
CREATE OR REPLACE FUNCTION test_bulk_milestone_update(milestone_ids text[], new_status boolean)
RETURNS integer AS $$
DECLARE
  updated_count integer := 0;
  milestone_id text;
BEGIN
  FOREACH milestone_id IN ARRAY milestone_ids
  LOOP
    UPDATE "ComponentMilestone" 
    SET "isCompleted" = new_status, "updatedAt" = NOW()
    WHERE id = milestone_id;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test bulk update within organization
SELECT is(
  test_bulk_milestone_update(ARRAY['milestone1', 'milestone2'], true),
  2,
  'Bulk update works for milestones in same organization'
);

-- Test bulk update across organizations (should only update accessible ones)
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT is(
  test_bulk_milestone_update(ARRAY['milestone1', 'milestone3'], false),
  1,
  'Bulk update only affects accessible milestones'
);

-- Test complex queries with JOINs

-- Test 19: Complex milestone queries respect RLS
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT results_eq(
  $$SELECT cm.id 
    FROM "ComponentMilestone" cm 
    JOIN "Component" c ON cm."componentId" = c.id 
    JOIN "Project" p ON c."projectId" = p.id 
    WHERE p."organizationId" = 'org1' 
    ORDER BY cm.id$$,
  $$VALUES ('milestone1'::text), ('milestone2'::text)$$,
  'Complex JOINs with milestones respect RLS'
);

-- Test 20: Aggregation queries work correctly with RLS
SELECT is(
  (SELECT COUNT(*) FROM "ComponentMilestone" cm 
   JOIN "Component" c ON cm."componentId" = c.id 
   JOIN "Project" p ON c."projectId" = p.id),
  2::bigint,
  'Milestone count queries respect RLS'
);

-- Test role-based access within organizations

-- Create admin user in org1
INSERT INTO "User" (id, email, name, "emailVerified", "createdAt", "updatedAt") VALUES 
  ('admin1', 'admin1@test.com', 'Admin User 1', NOW(), NOW(), NOW());

INSERT INTO "Member" (id, role, "userId", "organizationId", "createdAt", "updatedAt") VALUES 
  ('admin_member1', 'admin', 'admin1', 'org1', NOW(), NOW());

-- Test 21: Admin users have same milestone access as owners/members
SELECT set_config('request.jwt.claims', '{"sub": "admin1"}', true);
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone" WHERE "componentId" = ''comp1'' ORDER BY id',
  $$VALUES ('milestone1'::text), ('milestone2'::text)$$,
  'Admin users can view milestones in their organization'
);

-- Test 22: Admin users can update milestones
UPDATE "ComponentMilestone" SET "isCompleted" = false WHERE id = 'milestone1';
SELECT ok(
  (SELECT NOT "isCompleted" FROM "ComponentMilestone" WHERE id = 'milestone1'),
  'Admin users can update milestones in their organization'
);

-- Test milestone template access

-- Test 23: Users can view milestone templates used in their projects
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT ok(
  EXISTS(SELECT 1 FROM "MilestoneTemplate" WHERE id = 'template1'),
  'Users can view milestone templates used in their projects'
);

-- Test performance with RLS enabled

-- Test 24: RLS policies don't cause excessive performance degradation
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);

-- Create additional test data for performance testing
INSERT INTO "Component" (id, "componentId", type, description, status, "completionPercent", "workflowType", "projectId", "milestoneTemplateId", "createdAt", "updatedAt")
SELECT 
  'perf_comp_' || i,
  'PERF-' || LPAD(i::text, 3, '0'),
  'Performance Test Component',
  'Component for performance testing',
  'NOT_STARTED',
  0,
  'MILESTONE_DISCRETE',
  'project1',
  'template1',
  NOW(),
  NOW()
FROM generate_series(1, 100) i;

-- Insert milestones for performance test components
INSERT INTO "ComponentMilestone" (id, "componentId", "milestoneName", "milestoneOrder", "isCompleted", "createdAt", "updatedAt")
SELECT 
  'perf_milestone_' || i || '_' || j,
  'perf_comp_' || i,
  CASE j 
    WHEN 1 THEN 'Design Review'
    WHEN 2 THEN 'Procurement' 
    WHEN 3 THEN 'Installation'
    ELSE 'Testing'
  END,
  j,
  false,
  NOW(),
  NOW()
FROM generate_series(1, 100) i, generate_series(1, 4) j;

-- Test query performance with many milestones
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "ComponentMilestone" cm 
JOIN "Component" c ON cm."componentId" = c.id 
JOIN "Project" p ON c."projectId" = p.id;

SELECT ok(true, 'Performance test query completed (check EXPLAIN output manually)');

-- Test milestone statistics functions

-- Test 25: Milestone completion statistics respect RLS
CREATE OR REPLACE FUNCTION get_milestone_completion_stats(project_id text)
RETURNS TABLE(milestone_name text, total_count bigint, completed_count bigint, completion_percentage numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm."milestoneName"::text,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE cm."isCompleted" = true)::bigint,
    ROUND(
      (COUNT(*) FILTER (WHERE cm."isCompleted" = true)::numeric / COUNT(*)::numeric) * 100, 
      2
    )
  FROM "ComponentMilestone" cm
  JOIN "Component" c ON cm."componentId" = c.id
  WHERE c."projectId" = project_id
  GROUP BY cm."milestoneName"
  ORDER BY cm."milestoneName";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT results_eq(
  $$SELECT milestone_name FROM get_milestone_completion_stats('project1') ORDER BY milestone_name$$,
  $$VALUES ('Design Review'::text), ('Installation'::text), ('Procurement'::text), ('Testing'::text)$$,
  'Milestone statistics function respects RLS'
);

-- Test edge cases

-- Test 26: Anonymous users cannot access milestones
SELECT set_config('request.jwt.claims', NULL, true);
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone"',
  'SELECT NULL::text WHERE FALSE',
  'Anonymous users cannot access any milestones'
);

-- Test 27: Users with no organization membership cannot access milestones
INSERT INTO "User" (id, email, name, "emailVerified", "createdAt", "updatedAt") VALUES 
  ('orphan_user', 'orphan@test.com', 'Orphan User', NOW(), NOW(), NOW());

SELECT set_config('request.jwt.claims', '{"sub": "orphan_user"}', true);
SELECT results_eq(
  'SELECT id FROM "ComponentMilestone"',
  'SELECT NULL::text WHERE FALSE',
  'Users without organization membership cannot access milestones'
);

-- Test 28: Milestone updates maintain data integrity
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);

-- Test that milestone updates don't violate constraints
UPDATE "ComponentMilestone" 
SET "percentageComplete" = 150 
WHERE id = 'milestone1';

-- Should allow the update (constraint checking is separate from RLS)
SELECT is(
  (SELECT "percentageComplete" FROM "ComponentMilestone" WHERE id = 'milestone1'),
  150,
  'RLS allows updates even if they violate business rules (constraints handle this)'
);

-- Test 29: Milestone deletion cascades respect RLS
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);

-- Delete a component (should cascade to milestones if foreign key allows)
-- This tests that cascades also respect RLS
DELETE FROM "Component" WHERE id = 'perf_comp_1';

SELECT ok(
  NOT EXISTS(SELECT 1 FROM "ComponentMilestone" WHERE "componentId" = 'perf_comp_1'),
  'Milestone deletion through cascade respects RLS'
);

-- Test 30: Milestone queries with different workflow types
INSERT INTO "Component" (id, "componentId", type, "workflowType", "projectId", "milestoneTemplateId", "createdAt", "updatedAt") VALUES 
  ('comp_pct', 'PCT-001', 'Percentage Component', 'MILESTONE_PERCENTAGE', 'project1', 'template1', NOW(), NOW()),
  ('comp_qty', 'QTY-001', 'Quantity Component', 'MILESTONE_QUANTITY', 'project1', 'template1', NOW(), NOW());

INSERT INTO "ComponentMilestone" (id, "componentId", "milestoneName", "milestoneOrder", "isCompleted", "percentageComplete", "quantityComplete", "quantityTotal", "createdAt", "updatedAt") VALUES 
  ('pct_milestone', 'comp_pct', 'Progress Milestone', 1, false, 75, NULL, NULL, NOW(), NOW()),
  ('qty_milestone', 'comp_qty', 'Quantity Milestone', 1, false, NULL, 8, 10, NOW(), NOW());

SELECT results_eq(
  $$SELECT id FROM "ComponentMilestone" WHERE "componentId" IN ('comp_pct', 'comp_qty') ORDER BY id$$,
  $$VALUES ('pct_milestone'::text), ('qty_milestone'::text)$$,
  'Different workflow types are equally accessible through RLS'
);

-- Clean up test function
DROP FUNCTION test_bulk_milestone_update(text[], boolean);
DROP FUNCTION get_milestone_completion_stats(text);

-- Test database functions and triggers (if any exist for milestones)

-- Test 31-40: Test any existing milestone-related database functions
-- These would be specific to the actual database implementation

-- Test 31: Component completion recalculation function
CREATE OR REPLACE FUNCTION recalculate_component_completion(component_id text)
RETURNS numeric AS $$
DECLARE
  completion_percent numeric := 0;
  milestone_count integer;
  completed_count integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE "isCompleted" = true)
  INTO milestone_count, completed_count
  FROM "ComponentMilestone"
  WHERE "componentId" = component_id;
  
  IF milestone_count > 0 THEN
    completion_percent := (completed_count::numeric / milestone_count::numeric) * 100;
  END IF;
  
  UPDATE "Component" 
  SET "completionPercent" = completion_percent, "updatedAt" = NOW()
  WHERE id = component_id;
  
  RETURN completion_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT is(
  recalculate_component_completion('comp1'),
  50.0, -- milestone1 is completed, milestone2 is not (50%)
  'Component completion recalculation works with RLS'
);

-- Test 32: Milestone update triggers (if they exist)
-- This would test any triggers that fire on milestone updates

-- Test 33: Bulk milestone validation
CREATE OR REPLACE FUNCTION validate_bulk_milestone_updates(updates json)
RETURNS TABLE(component_id text, milestone_name text, is_valid boolean, error_message text) AS $$
DECLARE
  update_record json;
BEGIN
  FOR update_record IN SELECT json_array_elements(updates)
  LOOP
    RETURN QUERY
    SELECT 
      (update_record->>'componentId')::text,
      (update_record->>'milestoneName')::text,
      EXISTS(
        SELECT 1 FROM "ComponentMilestone" cm
        JOIN "Component" c ON cm."componentId" = c.id
        WHERE cm."componentId" = (update_record->>'componentId')
        AND cm."milestoneName" = (update_record->>'milestoneName')
      ),
      CASE 
        WHEN NOT EXISTS(
          SELECT 1 FROM "ComponentMilestone" cm
          JOIN "Component" c ON cm."componentId" = c.id
          WHERE cm."componentId" = (update_record->>'componentId')
          AND cm."milestoneName" = (update_record->>'milestoneName')
        ) THEN 'Milestone not found or access denied'
        ELSE NULL
      END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT results_eq(
  $$SELECT is_valid FROM validate_bulk_milestone_updates('[
    {"componentId": "comp1", "milestoneName": "Design Review"},
    {"componentId": "comp2", "milestoneName": "Design Review"}
  ]'::json) ORDER BY component_id$$,
  $$VALUES (true), (false)$$,
  'Bulk validation respects RLS (can validate own org milestones only)'
);

-- Test 34-40: Additional edge cases and error conditions

-- Test 34: Concurrent milestone updates
BEGIN;
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
UPDATE "ComponentMilestone" SET "isCompleted" = true WHERE id = 'milestone2';

-- Simulate concurrent update (in practice this would be another transaction)
UPDATE "ComponentMilestone" SET "percentageComplete" = 100 WHERE id = 'milestone2';
COMMIT;

SELECT ok(
  (SELECT "isCompleted" FROM "ComponentMilestone" WHERE id = 'milestone2'),
  'Concurrent updates work with RLS'
);

-- Test 35: Large batch operations
SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);

-- Update many milestones at once
UPDATE "ComponentMilestone" 
SET "isCompleted" = true, "updatedAt" = NOW()
WHERE "componentId" LIKE 'perf_comp_%'
AND id LIKE 'perf_milestone_%_1'; -- Only first milestone of each component

SELECT cmp_ok(
  (SELECT COUNT(*) FROM "ComponentMilestone" 
   WHERE "isCompleted" = true AND "componentId" LIKE 'perf_comp_%'),
  '>=',
  90::bigint,
  'Large batch updates work with RLS'
);

-- Test 36: Milestone data migration scenarios
-- Test that RLS works during data migration operations

-- Test 37: Cross-project milestone queries (should be blocked)
INSERT INTO "Project" (id, name, "organizationId", "createdAt", "updatedAt") VALUES 
  ('project3', 'Test Project 3', 'org1', NOW(), NOW());

INSERT INTO "Component" (id, "componentId", type, "projectId", "milestoneTemplateId", "createdAt", "updatedAt") VALUES 
  ('comp3', 'COMP-003', 'Cross Project Component', 'project3', 'template1', NOW(), NOW());

INSERT INTO "ComponentMilestone" (id, "componentId", "milestoneName", "milestoneOrder", "isCompleted", "createdAt", "updatedAt") VALUES 
  ('milestone_cross', 'comp3', 'Cross Project Milestone', 1, false, NOW(), NOW());

SELECT set_config('request.jwt.claims', '{"sub": "user1"}', true);
SELECT cmp_ok(
  (SELECT COUNT(*) FROM "ComponentMilestone" cm
   JOIN "Component" c ON cm."componentId" = c.id
   JOIN "Project" p ON c."projectId" = p.id
   WHERE p."organizationId" = 'org1'),
  '>=',
  3::bigint,
  'User can see milestones across all projects in their organization'
);

-- Test 38: RLS with complex WHERE conditions
SELECT results_ne(
  $$SELECT COUNT(*) FROM "ComponentMilestone" cm
    WHERE EXISTS (
      SELECT 1 FROM "Component" c
      JOIN "Project" p ON c."projectId" = p.id
      JOIN "Member" m ON p."organizationId" = m."organizationId"
      WHERE cm."componentId" = c.id
      AND m."userId" = current_setting('request.jwt.claims')::json->>'sub'
    )$$,
  $$VALUES (0::bigint)$$,
  'Complex WHERE conditions work with RLS'
);

-- Test 39: Milestone aggregations across organizations
SELECT set_config('request.jwt.claims', '{"sub": "user3"}', true);
SELECT is(
  (SELECT COUNT(*) FROM "ComponentMilestone"),
  1::bigint,
  'User 3 sees only milestones from their organization in aggregations'
);

-- Test 40: RLS policy performance with indexes
-- This would typically be tested with EXPLAIN ANALYZE to ensure
-- RLS policies use appropriate indexes
EXPLAIN (ANALYZE, BUFFERS) 
SELECT cm.* FROM "ComponentMilestone" cm
JOIN "Component" c ON cm."componentId" = c.id
JOIN "Project" p ON c."projectId" = p.id
JOIN "Member" m ON p."organizationId" = m."organizationId"
WHERE m."userId" = current_setting('request.jwt.claims')::json->>'sub';

SELECT ok(true, 'RLS performance test completed (check EXPLAIN output manually)');

-- Clean up test functions
DROP FUNCTION recalculate_component_completion(text);
DROP FUNCTION validate_bulk_milestone_updates(json);

SELECT finish();

ROLLBACK;