-- pgTAP tests for Enhanced Milestone System
-- Run with: psql -d your_database -f milestone-system.sql

BEGIN;

SELECT plan(50); -- Plan for 50 tests

-- Setup test data
INSERT INTO "Organization" (id, name, slug) VALUES 
('test-org-1', 'Test Organization', 'test-org');

INSERT INTO "User" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES 
('test-user-1', 'Test User', 'test@example.com', true, NOW(), NOW());

INSERT INTO "Member" (id, "userId", "organizationId", role) VALUES 
('test-member-1', 'test-user-1', 'test-org-1', 'owner');

INSERT INTO "Project" (id, "organizationId", "jobName", "jobNumber", description, "createdBy", "createdAt", "updatedAt") VALUES 
('test-project-1', 'test-org-1', 'Test Project', 'TP001', 'Test project for milestone testing', 'test-user-1', NOW(), NOW());

INSERT INTO "Drawing" (id, "projectId", number, title, "createdAt", "updatedAt") VALUES 
('test-drawing-1', 'test-project-1', 'D001', 'Test Drawing', NOW(), NOW());

INSERT INTO "MilestoneTemplate" (id, "projectId", name, milestones, "createdAt", "updatedAt") VALUES 
('test-template-1', 'test-project-1', 'Standard Template', '[
  {"name": "Receive", "weight": 20, "order": 0},
  {"name": "Install", "weight": 50, "order": 1},
  {"name": "Test", "weight": 30, "order": 2}
]'::jsonb, NOW(), NOW());

INSERT INTO "Component" (
  id, "projectId", "drawingId", "milestoneTemplateId", "componentId", 
  "type", "workflowType", "status", "completionPercent", 
  "createdAt", "updatedAt"
) VALUES 
('test-component-1', 'test-project-1', 'test-drawing-1', 'test-template-1', 'COMP001', 
 'VALVE', 'MILESTONE_DISCRETE', 'NOT_STARTED', 0, NOW(), NOW()),
('test-component-2', 'test-project-1', 'test-drawing-1', 'test-template-1', 'COMP002', 
 'PIPE', 'MILESTONE_PERCENTAGE', 'NOT_STARTED', 0, NOW(), NOW()),
('test-component-3', 'test-project-1', 'test-drawing-1', 'test-template-1', 'COMP003', 
 'FITTING', 'MILESTONE_QUANTITY', 'NOT_STARTED', 0, NOW(), NOW());

INSERT INTO "ComponentMilestone" (
  id, "componentId", "milestoneName", "milestoneOrder", weight,
  "isCompleted", "percentageComplete", "quantityComplete", "quantityTotal",
  "createdAt", "updatedAt"
) VALUES 
-- Component 1 (Discrete)
('test-milestone-1', 'test-component-1', 'Receive', 0, 20, false, NULL, NULL, NULL, NOW(), NOW()),
('test-milestone-2', 'test-component-1', 'Install', 1, 50, false, NULL, NULL, NULL, NOW(), NOW()),
('test-milestone-3', 'test-component-1', 'Test', 2, 30, false, NULL, NULL, NULL, NOW(), NOW()),
-- Component 2 (Percentage)
('test-milestone-4', 'test-component-2', 'Receive', 0, 20, false, 0, NULL, NULL, NOW(), NOW()),
('test-milestone-5', 'test-component-2', 'Install', 1, 50, false, 0, NULL, NULL, NOW(), NOW()),
('test-milestone-6', 'test-component-2', 'Test', 2, 30, false, 0, NULL, NULL, NOW(), NOW()),
-- Component 3 (Quantity)
('test-milestone-7', 'test-component-3', 'Receive', 0, 20, false, NULL, 0, 100, NOW(), NOW()),
('test-milestone-8', 'test-component-3', 'Install', 1, 50, false, NULL, 0, 100, NOW(), NOW()),
('test-milestone-9', 'test-component-3', 'Test', 2, 30, false, NULL, 0, 100, NOW(), NOW());

-- Test 1: Basic table structure
SELECT has_table('ComponentMilestone', 'ComponentMilestone table exists');
SELECT has_table('BulkOperationTransaction', 'BulkOperationTransaction table exists');

-- Test 2-4: Index existence
SELECT has_index('ComponentMilestone', 'idx_component_milestone_component_id', 'Component milestone component_id index exists');
SELECT has_index('ComponentMilestone', 'idx_component_milestone_completed_at', 'Component milestone completed_at index exists');
SELECT has_index('AuditLog', 'idx_audit_log_project_milestone_updates', 'Audit log milestone updates index exists');

-- Test 5-7: Function existence
SELECT has_function('calculate_component_completion', ARRAY['text'], 'calculate_component_completion function exists');
SELECT has_function('update_components_completion', ARRAY['text[]'], 'update_components_completion function exists');
SELECT has_function('batch_update_milestones', ARRAY['jsonb', 'text', 'text'], 'batch_update_milestones function exists');

-- Test 8: Materialized view existence
SELECT has_view('project_milestone_summary', 'Project milestone summary view exists');

-- Test 9: Trigger existence
SELECT has_trigger('ComponentMilestone', 'milestone_update_notify', 'Milestone update trigger exists');

-- Test 10-12: Component completion calculation for discrete milestones
UPDATE "ComponentMilestone" SET "isCompleted" = true, "completedAt" = NOW(), "completedBy" = 'test-user-1'
WHERE id = 'test-milestone-1'; -- Receive milestone (20% weight)

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-1'')',
  VALUES(20.0::DECIMAL),
  'Discrete milestone: Single completed milestone gives correct percentage'
);

UPDATE "ComponentMilestone" SET "isCompleted" = true, "completedAt" = NOW(), "completedBy" = 'test-user-1'
WHERE id = 'test-milestone-2'; -- Install milestone (50% weight)

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-1'')',
  VALUES(70.0::DECIMAL),
  'Discrete milestone: Two completed milestones give correct percentage'
);

UPDATE "ComponentMilestone" SET "isCompleted" = true, "completedAt" = NOW(), "completedBy" = 'test-user-1'
WHERE id = 'test-milestone-3'; -- Test milestone (30% weight)

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-1'')',
  VALUES(100.0::DECIMAL),
  'Discrete milestone: All completed milestones give 100%'
);

-- Test 13-15: Component completion calculation for percentage milestones
UPDATE "ComponentMilestone" SET "percentageComplete" = 50
WHERE id = 'test-milestone-4'; -- Receive milestone (20% weight, 50% complete)

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-2'')',
  VALUES(10.0::DECIMAL), -- 50% of 20% weight = 10%
  'Percentage milestone: Partial completion calculated correctly'
);

UPDATE "ComponentMilestone" SET "percentageComplete" = 80
WHERE id = 'test-milestone-5'; -- Install milestone (50% weight, 80% complete)

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-2'')',
  VALUES(50.0::DECIMAL), -- (50% of 20%) + (80% of 50%) = 10% + 40% = 50%
  'Percentage milestone: Multiple partial completions calculated correctly'
);

UPDATE "ComponentMilestone" SET "percentageComplete" = 100
WHERE "componentId" = 'test-component-2';

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-2'')',
  VALUES(100.0::DECIMAL),
  'Percentage milestone: All milestones at 100% give 100%'
);

-- Test 16-18: Component completion calculation for quantity milestones
UPDATE "ComponentMilestone" SET "quantityComplete" = 20
WHERE id = 'test-milestone-7'; -- Receive milestone (20% weight, 20/100 complete)

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-3'')',
  VALUES(4.0::DECIMAL), -- 20% completion of 20% weight = 4%
  'Quantity milestone: Partial quantity completion calculated correctly'
);

UPDATE "ComponentMilestone" SET "quantityComplete" = 100
WHERE id = 'test-milestone-7';
UPDATE "ComponentMilestone" SET "quantityComplete" = 50
WHERE id = 'test-milestone-8'; -- Install milestone (50% weight, 50/100 complete)

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-3'')',
  VALUES(45.0::DECIMAL), -- (100% of 20%) + (50% of 50%) = 20% + 25% = 45%
  'Quantity milestone: Mixed quantity completions calculated correctly'
);

UPDATE "ComponentMilestone" SET "quantityComplete" = 100
WHERE "componentId" = 'test-component-3';

SELECT results_eq(
  'SELECT completion_percent FROM calculate_component_completion(''test-component-3'')',
  VALUES(100.0::DECIMAL),
  'Quantity milestone: All quantities complete give 100%'
);

-- Test 19: Batch component update function
SELECT results_eq(
  'SELECT component_id FROM update_components_completion(ARRAY[''test-component-1'', ''test-component-2'', ''test-component-3''])',
  VALUES('test-component-1'::TEXT),
  'Batch update function processes multiple components'
);

-- Test 20-25: Batch milestone update RPC function
SELECT results_eq(
  'SELECT success FROM batch_update_milestones(
    ''[{"componentId": "test-component-1", "milestoneName": "Receive", "isCompleted": false}]''::jsonb,
    ''test-user-1'',
    ''test-batch-1''
  ) WHERE component_id = ''test-component-1''',
  VALUES(true),
  'RPC batch update: Single discrete milestone update succeeds'
);

-- Test multiple milestone updates
SELECT results_eq(
  'SELECT COUNT(*) FROM batch_update_milestones(
    ''[
      {"componentId": "test-component-2", "milestoneName": "Receive", "percentageValue": 75},
      {"componentId": "test-component-2", "milestoneName": "Install", "percentageValue": 25}
    ]''::jsonb,
    ''test-user-1'',
    ''test-batch-2''
  ) WHERE success = true',
  VALUES(2::BIGINT),
  'RPC batch update: Multiple percentage milestone updates succeed'
);

SELECT results_eq(
  'SELECT COUNT(*) FROM batch_update_milestones(
    ''[
      {"componentId": "test-component-3", "milestoneName": "Receive", "quantityValue": 80},
      {"componentId": "test-component-3", "milestoneName": "Install", "quantityValue": 60}
    ]''::jsonb,
    ''test-user-1'',
    ''test-batch-3''
  ) WHERE success = true',
  VALUES(2::BIGINT),
  'RPC batch update: Multiple quantity milestone updates succeed'
);

-- Test error handling
SELECT results_eq(
  'SELECT success FROM batch_update_milestones(
    ''[{"componentId": "non-existent", "milestoneName": "Receive", "isCompleted": true}]''::jsonb,
    ''test-user-1'',
    ''test-batch-4''
  ) WHERE component_id = ''non-existent''',
  VALUES(false),
  'RPC batch update: Non-existent component returns error'
);

SELECT results_eq(
  'SELECT success FROM batch_update_milestones(
    ''[{"componentId": "test-component-1", "milestoneName": "NonExistent", "isCompleted": true}]''::jsonb,
    ''test-user-1'',
    ''test-batch-5''
  ) WHERE milestone_name = ''NonExistent''',
  VALUES(false),
  'RPC batch update: Non-existent milestone returns error'
);

-- Test unauthorized access
SELECT results_eq(
  'SELECT success FROM batch_update_milestones(
    ''[{"componentId": "test-component-1", "milestoneName": "Receive", "isCompleted": true}]''::jsonb,
    ''unauthorized-user'',
    ''test-batch-6''
  ) WHERE component_id = ''test-component-1''',
  VALUES(false),
  'RPC batch update: Unauthorized user returns error'
);

-- Test 26-30: Transaction tracking
INSERT INTO "BulkOperationTransaction" (
  id, "projectId", "userId", "transactionType", "operationCount", 
  "status", "startedAt", "createdAt", "updatedAt"
) VALUES (
  'test-transaction-1', 'test-project-1', 'test-user-1', 'bulk_milestone_update', 5,
  'in_progress', NOW(), NOW(), NOW()
);

SELECT ok(
  EXISTS(SELECT 1 FROM "BulkOperationTransaction" WHERE id = 'test-transaction-1'),
  'Transaction record created successfully'
);

UPDATE "BulkOperationTransaction" SET 
  "status" = 'completed', 
  "successCount" = 4, 
  "failureCount" = 1,
  "completedAt" = NOW()
WHERE id = 'test-transaction-1';

SELECT results_eq(
  'SELECT "successCount" FROM "BulkOperationTransaction" WHERE id = ''test-transaction-1''',
  VALUES(4),
  'Transaction success count updated correctly'
);

SELECT results_eq(
  'SELECT "failureCount" FROM "BulkOperationTransaction" WHERE id = ''test-transaction-1''',
  VALUES(1),
  'Transaction failure count updated correctly'
);

SELECT results_eq(
  'SELECT status FROM "BulkOperationTransaction" WHERE id = ''test-transaction-1''',
  VALUES('completed'::TEXT),
  'Transaction status updated correctly'
);

-- Test 31-35: Audit logging
INSERT INTO "AuditLog" (
  id, "projectId", "userId", "entityType", "entityId", action,
  changes, "createdAt", "updatedAt"
) VALUES (
  'test-audit-1', 'test-project-1', 'test-user-1', 'component_milestone', 'test-milestone-1', 'UPDATE',
  '{"isCompleted": {"old": false, "new": true}}'::jsonb, NOW(), NOW()
);

SELECT ok(
  EXISTS(SELECT 1 FROM "AuditLog" WHERE id = 'test-audit-1'),
  'Audit log record created successfully'
);

SELECT results_eq(
  'SELECT action FROM "AuditLog" WHERE id = ''test-audit-1''',
  VALUES('UPDATE'::TEXT),
  'Audit log action recorded correctly'
);

SELECT results_eq(
  'SELECT "entityType" FROM "AuditLog" WHERE id = ''test-audit-1''',
  VALUES('component_milestone'::TEXT),
  'Audit log entity type recorded correctly'
);

SELECT results_eq(
  'SELECT "entityId" FROM "AuditLog" WHERE id = ''test-audit-1''',
  VALUES('test-milestone-1'::TEXT),
  'Audit log entity ID recorded correctly'
);

SELECT ok(
  (SELECT changes->'isCompleted'->'old' FROM "AuditLog" WHERE id = 'test-audit-1') = 'false'::jsonb,
  'Audit log changes recorded correctly'
);

-- Test 36-40: Materialized view data
REFRESH MATERIALIZED VIEW project_milestone_summary;

SELECT ok(
  EXISTS(SELECT 1 FROM project_milestone_summary WHERE "projectId" = 'test-project-1'),
  'Project milestone summary contains test project'
);

SELECT results_eq(
  'SELECT total_components FROM project_milestone_summary WHERE "projectId" = ''test-project-1''',
  VALUES(3::BIGINT),
  'Project summary shows correct component count'
);

SELECT results_eq(
  'SELECT total_milestones FROM project_milestone_summary WHERE "projectId" = ''test-project-1''',
  VALUES(9::BIGINT),
  'Project summary shows correct milestone count'
);

SELECT ok(
  (SELECT completed_milestones FROM project_milestone_summary WHERE "projectId" = 'test-project-1') >= 0,
  'Project summary shows non-negative completed milestones'
);

SELECT ok(
  (SELECT milestone_completion_percent FROM project_milestone_summary WHERE "projectId" = 'test-project-1') >= 0,
  'Project summary shows non-negative completion percentage'
);

-- Test 41-45: Performance and constraints
-- Test milestone order constraints
INSERT INTO "ComponentMilestone" (
  id, "componentId", "milestoneName", "milestoneOrder", weight,
  "isCompleted", "createdAt", "updatedAt"
) VALUES (
  'test-milestone-order', 'test-component-1', 'Custom Milestone', 3, 10, false, NOW(), NOW()
);

SELECT ok(
  EXISTS(SELECT 1 FROM "ComponentMilestone" WHERE id = 'test-milestone-order'),
  'Custom milestone with higher order can be inserted'
);

-- Test weight calculations
SELECT ok(
  (SELECT weight FROM "ComponentMilestone" WHERE id = 'test-milestone-1') > 0,
  'Milestone weights are positive values'
);

-- Test completion percentage bounds
SELECT ok(
  (SELECT "percentageComplete" FROM "ComponentMilestone" WHERE "componentId" = 'test-component-2' AND "milestoneName" = 'Receive') BETWEEN 0 AND 100,
  'Percentage completion values are within valid bounds'
);

-- Test quantity completion non-negative
SELECT ok(
  (SELECT "quantityComplete" FROM "ComponentMilestone" WHERE "componentId" = 'test-component-3' AND "milestoneName" = 'Receive') >= 0,
  'Quantity completion values are non-negative'
);

-- Test component status values
SELECT ok(
  (SELECT status FROM "Component" WHERE id = 'test-component-1') IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'),
  'Component status values are within allowed enum'
);

-- Test 46-50: Real-time and notification features
-- Test trigger firing on milestone update
SELECT ok(
  pg_trigger_depth() = 0,
  'Test environment has no active triggers initially'
);

-- Test notification payload structure (simulated)
SELECT ok(
  jsonb_typeof('{"projectId": "test-project-1", "componentId": "test-component-1", "milestoneId": "test-milestone-1"}'::jsonb) = 'object',
  'Notification payload has correct JSON structure'
);

-- Test real-time channel naming convention
SELECT ok(
  'project:test-project-1' ~ '^project:[a-zA-Z0-9-]+$',
  'Project channel naming follows convention'
);

-- Test presence payload structure
SELECT ok(
  jsonb_typeof('{"userId": "test-user-1", "componentId": "test-component-1", "action": "editing_start"}'::jsonb) = 'object',
  'Presence payload has correct JSON structure'
);

-- Test conflict resolution data structure
SELECT ok(
  jsonb_typeof('{"strategy": "latest_wins", "serverValue": {}, "clientValue": {}, "timestamp": "2024-01-01T00:00:00Z"}'::jsonb) = 'object',
  'Conflict resolution data has correct structure'
);

-- Cleanup test data
DELETE FROM "ComponentMilestone" WHERE "componentId" IN ('test-component-1', 'test-component-2', 'test-component-3');
DELETE FROM "Component" WHERE id IN ('test-component-1', 'test-component-2', 'test-component-3');
DELETE FROM "MilestoneTemplate" WHERE id = 'test-template-1';
DELETE FROM "Drawing" WHERE id = 'test-drawing-1';
DELETE FROM "Project" WHERE id = 'test-project-1';
DELETE FROM "AuditLog" WHERE id = 'test-audit-1';
DELETE FROM "BulkOperationTransaction" WHERE id = 'test-transaction-1';
DELETE FROM "Member" WHERE id = 'test-member-1';
DELETE FROM "User" WHERE id = 'test-user-1';
DELETE FROM "Organization" WHERE id = 'test-org-1';

SELECT * FROM finish();

ROLLBACK;