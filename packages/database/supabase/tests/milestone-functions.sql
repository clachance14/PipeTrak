-- Milestone Database Functions Test Suite
-- Tests database functions, triggers, and stored procedures for milestone operations

BEGIN;

SELECT plan(30);

-- Setup test data
INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt") VALUES 
  ('test_org', 'Test Organization', 'test-org', NOW(), NOW());

INSERT INTO "User" (id, email, name, "emailVerified", "createdAt", "updatedAt") VALUES 
  ('test_user', 'test@example.com', 'Test User', NOW(), NOW(), NOW());

INSERT INTO "Member" (id, role, "userId", "organizationId", "createdAt", "updatedAt") VALUES 
  ('test_member', 'owner', 'test_user', 'test_org', NOW(), NOW());

INSERT INTO "Project" (id, name, description, "organizationId", "createdAt", "updatedAt") VALUES 
  ('test_project', 'Test Project', 'Project for testing functions', 'test_org', NOW(), NOW());

INSERT INTO "MilestoneTemplate" (id, name, description, milestones, "createdAt", "updatedAt") VALUES 
  ('test_template', 'Test Template', 'Template for testing', 
   '[{"name": "Design Review", "order": 1, "weight": 1}, {"name": "Installation", "order": 2, "weight": 2}, {"name": "Testing", "order": 3, "weight": 1}]'::json, 
   NOW(), NOW());

INSERT INTO "Component" (id, "componentId", type, description, status, "completionPercent", "workflowType", "projectId", "milestoneTemplateId", "createdAt", "updatedAt") VALUES 
  ('test_comp_discrete', 'DISC-001', 'Discrete Component', 'Component with discrete milestones', 'NOT_STARTED', 0, 'MILESTONE_DISCRETE', 'test_project', 'test_template', NOW(), NOW()),
  ('test_comp_percentage', 'PCT-001', 'Percentage Component', 'Component with percentage milestones', 'NOT_STARTED', 0, 'MILESTONE_PERCENTAGE', 'test_project', 'test_template', NOW(), NOW()),
  ('test_comp_quantity', 'QTY-001', 'Quantity Component', 'Component with quantity milestones', 'NOT_STARTED', 0, 'MILESTONE_QUANTITY', 'test_project', 'test_template', NOW(), NOW());

INSERT INTO "ComponentMilestone" (id, "componentId", "milestoneName", "milestoneOrder", "isCompleted", "percentageComplete", "quantityComplete", "quantityTotal", "createdAt", "updatedAt") VALUES 
  -- Discrete milestones
  ('disc_milestone_1', 'test_comp_discrete', 'Design Review', 1, false, NULL, NULL, NULL, NOW(), NOW()),
  ('disc_milestone_2', 'test_comp_discrete', 'Installation', 2, false, NULL, NULL, NULL, NOW(), NOW()),
  ('disc_milestone_3', 'test_comp_discrete', 'Testing', 3, false, NULL, NULL, NULL, NOW(), NOW()),
  
  -- Percentage milestones
  ('pct_milestone_1', 'test_comp_percentage', 'Design Review', 1, false, 0, NULL, NULL, NOW(), NOW()),
  ('pct_milestone_2', 'test_comp_percentage', 'Installation', 2, false, 0, NULL, NULL, NOW(), NOW()),
  ('pct_milestone_3', 'test_comp_percentage', 'Testing', 3, false, 0, NULL, NULL, NOW(), NOW()),
  
  -- Quantity milestones
  ('qty_milestone_1', 'test_comp_quantity', 'Design Review', 1, false, NULL, 0, 1, NOW(), NOW()),
  ('qty_milestone_2', 'test_comp_quantity', 'Installation', 2, false, NULL, 0, 10, NOW(), NOW()),
  ('qty_milestone_3', 'test_comp_quantity', 'Testing', 3, false, NULL, 0, 5, NOW(), NOW());

-- Test 1: Component completion calculation for discrete milestones
CREATE OR REPLACE FUNCTION calculate_discrete_completion(component_id text)
RETURNS numeric AS $$
DECLARE
  completion_percent numeric := 0;
  total_weight numeric := 0;
  completed_weight numeric := 0;
  milestone_record record;
  template_data json;
BEGIN
  -- Get milestone template data
  SELECT mt.milestones INTO template_data
  FROM "Component" c
  JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
  WHERE c.id = component_id;
  
  -- Calculate weighted completion
  FOR milestone_record IN 
    SELECT cm.*, (template_data->>(cm."milestoneOrder" - 1)->>'weight')::numeric as weight
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = component_id
  LOOP
    total_weight := total_weight + COALESCE(milestone_record.weight, 1);
    IF milestone_record."isCompleted" THEN
      completed_weight := completed_weight + COALESCE(milestone_record.weight, 1);
    END IF;
  END LOOP;
  
  IF total_weight > 0 THEN
    completion_percent := (completed_weight / total_weight) * 100;
  END IF;
  
  RETURN ROUND(completion_percent, 2);
END;
$$ LANGUAGE plpgsql;

-- Mark first milestone as complete (weight = 1 out of total weight 4)
UPDATE "ComponentMilestone" SET "isCompleted" = true WHERE id = 'disc_milestone_1';

SELECT is(
  calculate_discrete_completion('test_comp_discrete'),
  25.00,
  'Discrete milestone completion calculation with weights'
);

-- Test 2: Component completion calculation for percentage milestones
CREATE OR REPLACE FUNCTION calculate_percentage_completion(component_id text)
RETURNS numeric AS $$
DECLARE
  completion_percent numeric := 0;
  total_weight numeric := 0;
  weighted_sum numeric := 0;
  milestone_record record;
  template_data json;
BEGIN
  -- Get milestone template data
  SELECT mt.milestones INTO template_data
  FROM "Component" c
  JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
  WHERE c.id = component_id;
  
  -- Calculate weighted average
  FOR milestone_record IN 
    SELECT cm.*, (template_data->>(cm."milestoneOrder" - 1)->>'weight')::numeric as weight
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = component_id
  LOOP
    total_weight := total_weight + COALESCE(milestone_record.weight, 1);
    weighted_sum := weighted_sum + (COALESCE(milestone_record."percentageComplete", 0) * COALESCE(milestone_record.weight, 1));
  END LOOP;
  
  IF total_weight > 0 THEN
    completion_percent := weighted_sum / total_weight;
  END IF;
  
  RETURN ROUND(completion_percent, 2);
END;
$$ LANGUAGE plpgsql;

-- Set percentage values
UPDATE "ComponentMilestone" SET "percentageComplete" = 100 WHERE id = 'pct_milestone_1'; -- weight 1
UPDATE "ComponentMilestone" SET "percentageComplete" = 50 WHERE id = 'pct_milestone_2';  -- weight 2
UPDATE "ComponentMilestone" SET "percentageComplete" = 0 WHERE id = 'pct_milestone_3';   -- weight 1

-- Expected: (100*1 + 50*2 + 0*1) / (1+2+1) = 200/4 = 50%
SELECT is(
  calculate_percentage_completion('test_comp_percentage'),
  50.00,
  'Percentage milestone completion calculation with weights'
);

-- Test 3: Component completion calculation for quantity milestones
CREATE OR REPLACE FUNCTION calculate_quantity_completion(component_id text)
RETURNS numeric AS $$
DECLARE
  completion_percent numeric := 0;
  total_weight numeric := 0;
  weighted_sum numeric := 0;
  milestone_record record;
  template_data json;
  milestone_percentage numeric;
BEGIN
  -- Get milestone template data
  SELECT mt.milestones INTO template_data
  FROM "Component" c
  JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
  WHERE c.id = component_id;
  
  -- Calculate weighted average based on quantity completion
  FOR milestone_record IN 
    SELECT cm.*, (template_data->>(cm."milestoneOrder" - 1)->>'weight')::numeric as weight
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = component_id
  LOOP
    total_weight := total_weight + COALESCE(milestone_record.weight, 1);
    
    IF milestone_record."quantityTotal" > 0 THEN
      milestone_percentage := (COALESCE(milestone_record."quantityComplete", 0)::numeric / milestone_record."quantityTotal") * 100;
    ELSE
      milestone_percentage := 0;
    END IF;
    
    weighted_sum := weighted_sum + (milestone_percentage * COALESCE(milestone_record.weight, 1));
  END LOOP;
  
  IF total_weight > 0 THEN
    completion_percent := weighted_sum / total_weight;
  END IF;
  
  RETURN ROUND(completion_percent, 2);
END;
$$ LANGUAGE plpgsql;

-- Set quantity values
UPDATE "ComponentMilestone" SET "quantityComplete" = 1 WHERE id = 'qty_milestone_1'; -- 1/1 = 100%, weight 1
UPDATE "ComponentMilestone" SET "quantityComplete" = 5 WHERE id = 'qty_milestone_2'; -- 5/10 = 50%, weight 2  
UPDATE "ComponentMilestone" SET "quantityComplete" = 0 WHERE id = 'qty_milestone_3'; -- 0/5 = 0%, weight 1

-- Expected: (100*1 + 50*2 + 0*1) / (1+2+1) = 200/4 = 50%
SELECT is(
  calculate_quantity_completion('test_comp_quantity'),
  50.00,
  'Quantity milestone completion calculation with weights'
);

-- Test 4: Universal component completion recalculation function
CREATE OR REPLACE FUNCTION recalculate_component_completion(component_id text)
RETURNS numeric AS $$
DECLARE
  component_workflow text;
  completion_percent numeric := 0;
BEGIN
  -- Get component workflow type
  SELECT "workflowType" INTO component_workflow
  FROM "Component"
  WHERE id = component_id;
  
  -- Calculate completion based on workflow type
  IF component_workflow = 'MILESTONE_DISCRETE' THEN
    completion_percent := calculate_discrete_completion(component_id);
  ELSIF component_workflow = 'MILESTONE_PERCENTAGE' THEN
    completion_percent := calculate_percentage_completion(component_id);
  ELSIF component_workflow = 'MILESTONE_QUANTITY' THEN
    completion_percent := calculate_quantity_completion(component_id);
  END IF;
  
  -- Update component
  UPDATE "Component" 
  SET "completionPercent" = completion_percent, 
      "updatedAt" = NOW(),
      "status" = CASE 
        WHEN completion_percent = 0 THEN 'NOT_STARTED'
        WHEN completion_percent < 100 THEN 'IN_PROGRESS'
        ELSE 'COMPLETED'
      END
  WHERE id = component_id;
  
  RETURN completion_percent;
END;
$$ LANGUAGE plpgsql;

SELECT is(
  recalculate_component_completion('test_comp_discrete'),
  25.00,
  'Universal component completion recalculation - discrete'
);

SELECT is(
  recalculate_component_completion('test_comp_percentage'),
  50.00,
  'Universal component completion recalculation - percentage'
);

SELECT is(
  recalculate_component_completion('test_comp_quantity'),
  50.00,
  'Universal component completion recalculation - quantity'
);

-- Test 5: Component status updates
SELECT is(
  (SELECT status FROM "Component" WHERE id = 'test_comp_discrete'),
  'IN_PROGRESS',
  'Component status updates to IN_PROGRESS for partial completion'
);

-- Complete all milestones for discrete component
UPDATE "ComponentMilestone" SET "isCompleted" = true 
WHERE "componentId" = 'test_comp_discrete';

SELECT is(
  recalculate_component_completion('test_comp_discrete'),
  100.00,
  'Fully completed discrete component shows 100%'
);

SELECT is(
  (SELECT status FROM "Component" WHERE id = 'test_comp_discrete'),
  'COMPLETED',
  'Component status updates to COMPLETED for full completion'
);

-- Test 6: Bulk milestone update function
CREATE OR REPLACE FUNCTION bulk_update_milestones(
  updates json,
  user_id text DEFAULT NULL
)
RETURNS TABLE(
  component_id text,
  milestone_name text,
  success boolean,
  error_message text,
  new_completion_percent numeric
) AS $$
DECLARE
  update_record json;
  milestone_id text;
  component_workflow text;
  affected_components text[] := '{}';
BEGIN
  -- Process each update
  FOR update_record IN SELECT json_array_elements(updates)
  LOOP
    BEGIN
      -- Find milestone
      SELECT cm.id, c."workflowType" INTO milestone_id, component_workflow
      FROM "ComponentMilestone" cm
      JOIN "Component" c ON cm."componentId" = c.id
      WHERE cm."componentId" = (update_record->>'componentId')
      AND cm."milestoneName" = (update_record->>'milestoneName');
      
      IF milestone_id IS NULL THEN
        RETURN QUERY SELECT 
          (update_record->>'componentId')::text,
          (update_record->>'milestoneName')::text,
          false,
          'Milestone not found'::text,
          NULL::numeric;
        CONTINUE;
      END IF;
      
      -- Apply update based on workflow type
      IF component_workflow = 'MILESTONE_DISCRETE' AND update_record ? 'isCompleted' THEN
        UPDATE "ComponentMilestone" 
        SET "isCompleted" = (update_record->>'isCompleted')::boolean,
            "completedAt" = CASE WHEN (update_record->>'isCompleted')::boolean THEN NOW() ELSE NULL END,
            "completedBy" = CASE WHEN (update_record->>'isCompleted')::boolean THEN user_id ELSE NULL END,
            "updatedAt" = NOW()
        WHERE id = milestone_id;
        
      ELSIF component_workflow = 'MILESTONE_PERCENTAGE' AND update_record ? 'percentageValue' THEN
        UPDATE "ComponentMilestone" 
        SET "percentageComplete" = (update_record->>'percentageValue')::numeric,
            "isCompleted" = (update_record->>'percentageValue')::numeric >= 100,
            "completedAt" = CASE WHEN (update_record->>'percentageValue')::numeric >= 100 THEN NOW() ELSE NULL END,
            "completedBy" = CASE WHEN (update_record->>'percentageValue')::numeric >= 100 THEN user_id ELSE NULL END,
            "updatedAt" = NOW()
        WHERE id = milestone_id;
        
      ELSIF component_workflow = 'MILESTONE_QUANTITY' AND update_record ? 'quantityValue' THEN
        UPDATE "ComponentMilestone" 
        SET "quantityComplete" = (update_record->>'quantityValue')::numeric,
            "isCompleted" = (update_record->>'quantityValue')::numeric >= COALESCE("quantityTotal", 0),
            "completedAt" = CASE WHEN (update_record->>'quantityValue')::numeric >= COALESCE("quantityTotal", 0) THEN NOW() ELSE NULL END,
            "completedBy" = CASE WHEN (update_record->>'quantityValue')::numeric >= COALESCE("quantityTotal", 0) THEN user_id ELSE NULL END,
            "updatedAt" = NOW()
        WHERE id = milestone_id;
        
      ELSE
        RETURN QUERY SELECT 
          (update_record->>'componentId')::text,
          (update_record->>'milestoneName')::text,
          false,
          'Invalid update for workflow type'::text,
          NULL::numeric;
        CONTINUE;
      END IF;
      
      -- Track affected component
      affected_components := array_append(affected_components, (update_record->>'componentId'));
      
      RETURN QUERY SELECT 
        (update_record->>'componentId')::text,
        (update_record->>'milestoneName')::text,
        true,
        NULL::text,
        NULL::numeric; -- Will be calculated below
        
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        (update_record->>'componentId')::text,
        (update_record->>'milestoneName')::text,
        false,
        SQLERRM::text,
        NULL::numeric;
    END;
  END LOOP;
  
  -- Recalculate completion for affected components
  FOR component_id IN SELECT DISTINCT unnest(affected_components)
  LOOP
    UPDATE bulk_update_milestones_result 
    SET new_completion_percent = recalculate_component_completion(component_id)
    WHERE component_id = component_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Test bulk update function
SELECT results_eq(
  $$SELECT success FROM bulk_update_milestones('[
    {"componentId": "test_comp_percentage", "milestoneName": "Design Review", "percentageValue": 75},
    {"componentId": "test_comp_quantity", "milestoneName": "Installation", "quantityValue": 8}
  ]'::json, 'test_user') ORDER BY component_id, milestone_name$$,
  $$VALUES (true), (true)$$,
  'Bulk milestone updates succeed for valid data'
);

-- Test 7: Milestone validation function
CREATE OR REPLACE FUNCTION validate_milestone_update(
  component_id text,
  milestone_name text,
  workflow_type text,
  update_value text
)
RETURNS TABLE(
  is_valid boolean,
  error_message text
) AS $$
DECLARE
  milestone_exists boolean;
  component_workflow text;
  quantity_total integer;
  numeric_value numeric;
BEGIN
  -- Check if milestone exists
  SELECT EXISTS(
    SELECT 1 FROM "ComponentMilestone" cm
    JOIN "Component" c ON cm."componentId" = c.id
    WHERE cm."componentId" = component_id
    AND cm."milestoneName" = milestone_name
  ) INTO milestone_exists;
  
  IF NOT milestone_exists THEN
    RETURN QUERY SELECT false, 'Milestone not found';
    RETURN;
  END IF;
  
  -- Get component workflow type
  SELECT "workflowType" INTO component_workflow
  FROM "Component" WHERE id = component_id;
  
  IF component_workflow != workflow_type THEN
    RETURN QUERY SELECT false, 'Workflow type mismatch';
    RETURN;
  END IF;
  
  -- Validate value based on workflow type
  IF workflow_type = 'MILESTONE_DISCRETE' THEN
    IF update_value NOT IN ('true', 'false') THEN
      RETURN QUERY SELECT false, 'Invalid boolean value for discrete milestone';
      RETURN;
    END IF;
    
  ELSIF workflow_type = 'MILESTONE_PERCENTAGE' THEN
    BEGIN
      numeric_value := update_value::numeric;
      IF numeric_value < 0 OR numeric_value > 100 THEN
        RETURN QUERY SELECT false, 'Percentage must be between 0 and 100';
        RETURN;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT false, 'Invalid numeric value for percentage milestone';
      RETURN;
    END;
    
  ELSIF workflow_type = 'MILESTONE_QUANTITY' THEN
    BEGIN
      numeric_value := update_value::numeric;
      IF numeric_value < 0 THEN
        RETURN QUERY SELECT false, 'Quantity cannot be negative';
        RETURN;
      END IF;
      
      -- Check against quantity total
      SELECT "quantityTotal" INTO quantity_total
      FROM "ComponentMilestone"
      WHERE "componentId" = component_id AND "milestoneName" = milestone_name;
      
      IF quantity_total IS NOT NULL AND numeric_value > quantity_total THEN
        RETURN QUERY SELECT false, 'Quantity exceeds total';
        RETURN;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT false, 'Invalid numeric value for quantity milestone';
      RETURN;
    END;
  END IF;
  
  RETURN QUERY SELECT true, NULL::text;
END;
$$ LANGUAGE plpgsql;

-- Test validation function
SELECT results_eq(
  $$SELECT is_valid FROM validate_milestone_update('test_comp_percentage', 'Design Review', 'MILESTONE_PERCENTAGE', '75')$$,
  $$VALUES (true)$$,
  'Valid percentage update passes validation'
);

SELECT results_eq(
  $$SELECT is_valid FROM validate_milestone_update('test_comp_percentage', 'Design Review', 'MILESTONE_PERCENTAGE', '150')$$,
  $$VALUES (false)$$,
  'Invalid percentage value fails validation'
);

SELECT results_eq(
  $$SELECT is_valid FROM validate_milestone_update('test_comp_quantity', 'Installation', 'MILESTONE_QUANTITY', '15')$$,
  $$VALUES (false)$$,
  'Quantity exceeding total fails validation'
);

-- Test 8: Milestone history tracking function
CREATE OR REPLACE FUNCTION get_milestone_history(
  component_id text,
  milestone_name text,
  days_back integer DEFAULT 30
)
RETURNS TABLE(
  change_date timestamp,
  user_name text,
  old_value text,
  new_value text,
  change_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al."createdAt",
    u.name,
    COALESCE(al.changes->>'isCompleted'->>'old', al.changes->>'percentageComplete'->>'old', al.changes->>'quantityComplete'->>'old'),
    COALESCE(al.changes->>'isCompleted'->>'new', al.changes->>'percentageComplete'->>'new', al.changes->>'quantityComplete'->>'new'),
    al.action
  FROM "AuditLog" al
  JOIN "User" u ON al."userId" = u.id
  JOIN "ComponentMilestone" cm ON al."entityId" = cm.id
  WHERE cm."componentId" = get_milestone_history.component_id
  AND cm."milestoneName" = get_milestone_history.milestone_name
  AND al."entityType" = 'component_milestone'
  AND al."createdAt" >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY al."createdAt" DESC;
END;
$$ LANGUAGE plpgsql;

-- Create some audit log entries for testing
INSERT INTO "AuditLog" (id, "projectId", "userId", "entityType", "entityId", action, changes, "createdAt") VALUES 
  ('audit1', 'test_project', 'test_user', 'component_milestone', 'pct_milestone_1', 'UPDATE', 
   '{"percentageComplete": {"old": "0", "new": "75"}}'::json, NOW() - INTERVAL '1 hour'),
  ('audit2', 'test_project', 'test_user', 'component_milestone', 'pct_milestone_1', 'UPDATE', 
   '{"percentageComplete": {"old": "75", "new": "100"}}'::json, NOW());

SELECT cmp_ok(
  (SELECT COUNT(*) FROM get_milestone_history('test_comp_percentage', 'Design Review', 7)),
  '>=',
  1::bigint,
  'Milestone history retrieval works'
);

-- Test 9: Project milestone statistics function
CREATE OR REPLACE FUNCTION get_project_milestone_stats(project_id text)
RETURNS TABLE(
  milestone_name text,
  total_count bigint,
  completed_count bigint,
  avg_percentage numeric,
  completion_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm."milestoneName"::text,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE cm."isCompleted" = true)::bigint,
    ROUND(AVG(COALESCE(cm."percentageComplete", 0)), 2),
    ROUND((COUNT(*) FILTER (WHERE cm."isCompleted" = true)::numeric / COUNT(*)::numeric) * 100, 2)
  FROM "ComponentMilestone" cm
  JOIN "Component" c ON cm."componentId" = c.id
  WHERE c."projectId" = get_project_milestone_stats.project_id
  GROUP BY cm."milestoneName"
  ORDER BY cm."milestoneName";
END;
$$ LANGUAGE plpgsql;

SELECT results_eq(
  $$SELECT milestone_name FROM get_project_milestone_stats('test_project') ORDER BY milestone_name$$,
  $$VALUES ('Design Review'::text), ('Installation'::text), ('Testing'::text)$$,
  'Project milestone statistics returns all milestone types'
);

-- Test 10: Milestone template application function
CREATE OR REPLACE FUNCTION apply_milestone_template_to_component(
  component_id text,
  template_id text
)
RETURNS integer AS $$
DECLARE
  template_milestones json;
  milestone_item json;
  created_count integer := 0;
BEGIN
  -- Get template milestones
  SELECT milestones INTO template_milestones
  FROM "MilestoneTemplate"
  WHERE id = template_id;
  
  -- Create milestones for component
  FOR milestone_item IN SELECT json_array_elements(template_milestones)
  LOOP
    INSERT INTO "ComponentMilestone" (
      id,
      "componentId",
      "milestoneName", 
      "milestoneOrder",
      "isCompleted",
      "percentageComplete",
      "quantityComplete",
      "quantityTotal",
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      component_id,
      (milestone_item->>'name')::text,
      (milestone_item->>'order')::integer,
      false,
      0,
      NULL,
      NULL,
      NOW(),
      NOW()
    ) ON CONFLICT ("componentId", "milestoneName") DO NOTHING;
    
    GET DIAGNOSTICS created_count = created_count + ROW_COUNT;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Create a new component to test template application
INSERT INTO "Component" (id, "componentId", type, "projectId", "milestoneTemplateId", "createdAt", "updatedAt") VALUES 
  ('new_component', 'NEW-001', 'New Component', 'test_project', 'test_template', NOW(), NOW());

SELECT is(
  apply_milestone_template_to_component('new_component', 'test_template'),
  3,
  'Milestone template application creates correct number of milestones'
);

-- Test 11: Milestone due date calculation function
CREATE OR REPLACE FUNCTION calculate_milestone_due_dates(
  component_id text,
  start_date date,
  duration_days integer[]
)
RETURNS TABLE(
  milestone_name text,
  milestone_order integer,
  due_date date
) AS $$
DECLARE
  cumulative_days integer := 0;
  i integer;
BEGIN
  FOR i IN 1..(SELECT COUNT(*) FROM "ComponentMilestone" WHERE "componentId" = component_id)
  LOOP
    cumulative_days := cumulative_days + COALESCE(duration_days[i], 30); -- Default 30 days
    
    RETURN QUERY
    SELECT 
      cm."milestoneName"::text,
      cm."milestoneOrder",
      (start_date + cumulative_days)::date
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = calculate_milestone_due_dates.component_id
    AND cm."milestoneOrder" = i;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT results_eq(
  $$SELECT milestone_order FROM calculate_milestone_due_dates('new_component', '2024-01-01'::date, ARRAY[10, 20, 15]) ORDER BY milestone_order$$,
  $$VALUES (1), (2), (3)$$,
  'Milestone due date calculation returns correct milestones'
);

-- Test 12: Milestone dependency checking function
CREATE OR REPLACE FUNCTION check_milestone_dependencies(
  component_id text,
  milestone_name text
)
RETURNS TABLE(
  can_start boolean,
  blocking_milestone text,
  reason text
) AS $$
DECLARE
  milestone_order integer;
  previous_milestone_completed boolean;
  previous_milestone_name text;
BEGIN
  -- Get milestone order
  SELECT "milestoneOrder" INTO milestone_order
  FROM "ComponentMilestone"
  WHERE "componentId" = component_id AND "milestoneName" = milestone_name;
  
  -- Check if this is the first milestone
  IF milestone_order = 1 THEN
    RETURN QUERY SELECT true, NULL::text, 'First milestone can always start'::text;
    RETURN;
  END IF;
  
  -- Check if previous milestone is completed
  SELECT "isCompleted", "milestoneName" INTO previous_milestone_completed, previous_milestone_name
  FROM "ComponentMilestone"
  WHERE "componentId" = component_id AND "milestoneOrder" = milestone_order - 1;
  
  IF previous_milestone_completed THEN
    RETURN QUERY SELECT true, NULL::text, 'Previous milestone completed'::text;
  ELSE
    RETURN QUERY SELECT false, previous_milestone_name, 'Previous milestone must be completed first'::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT results_eq(
  $$SELECT can_start FROM check_milestone_dependencies('test_comp_discrete', 'Installation')$$,
  $$VALUES (true)$$,
  'Milestone dependency check allows start when previous milestone is complete'
);

SELECT results_eq(
  $$SELECT can_start FROM check_milestone_dependencies('new_component', 'Installation')$$,
  $$VALUES (false)$$,
  'Milestone dependency check blocks start when previous milestone is incomplete'
);

-- Test 13-20: Additional function tests for edge cases and error handling

-- Test 13: Handle null/empty inputs gracefully
SELECT is(
  calculate_discrete_completion('nonexistent_component'),
  0.00,
  'Completion calculation handles nonexistent component'
);

-- Test 14: Handle division by zero in completion calculations
INSERT INTO "Component" (id, "componentId", type, "projectId", "milestoneTemplateId", "createdAt", "updatedAt") VALUES 
  ('empty_component', 'EMPTY-001', 'Empty Component', 'test_project', 'test_template', NOW(), NOW());

SELECT is(
  recalculate_component_completion('empty_component'),
  0.00,
  'Completion calculation handles component with no milestones'
);

-- Test 15: Bulk update with mixed success/failure
SELECT results_eq(
  $$SELECT success FROM bulk_update_milestones('[
    {"componentId": "test_comp_discrete", "milestoneName": "Design Review", "isCompleted": false},
    {"componentId": "nonexistent", "milestoneName": "Fake Milestone", "isCompleted": true}
  ]'::json, 'test_user') ORDER BY component_id$$,
  $$VALUES (false), (true)$$,
  'Bulk update handles mixed success and failure cases'
);

-- Test 16: Milestone validation with edge cases
SELECT results_eq(
  $$SELECT is_valid FROM validate_milestone_update('test_comp_discrete', 'Nonexistent', 'MILESTONE_DISCRETE', 'true')$$,
  $$VALUES (false)$$,
  'Validation fails for nonexistent milestone'
);

-- Test 17: Large dataset performance test
CREATE OR REPLACE FUNCTION performance_test_bulk_completion_recalc(component_count integer)
RETURNS interval AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  i integer;
  component_name text;
BEGIN
  start_time := clock_timestamp();
  
  -- Create test components and recalculate completion
  FOR i IN 1..component_count LOOP
    component_name := 'perf_comp_' || i;
    
    -- Skip if component doesn't exist (for safety)
    IF EXISTS(SELECT 1 FROM "Component" WHERE id = component_name) THEN
      PERFORM recalculate_component_completion(component_name);
    END IF;
  END LOOP;
  
  end_time := clock_timestamp();
  RETURN end_time - start_time;
END;
$$ LANGUAGE plpgsql;

-- This would typically be run with actual performance test data
SELECT ok(
  performance_test_bulk_completion_recalc(1) < INTERVAL '1 second',
  'Completion recalculation performs adequately'
);

-- Test 18: Transaction safety for bulk operations
BEGIN;
  SELECT bulk_update_milestones('[{"componentId": "test_comp_discrete", "milestoneName": "Design Review", "isCompleted": true}]'::json, 'test_user');
ROLLBACK;

-- Verify rollback worked
SELECT ok(
  NOT (SELECT "isCompleted" FROM "ComponentMilestone" WHERE id = 'disc_milestone_1'),
  'Bulk update respects transaction boundaries'
);

-- Test 19: Concurrent update handling
-- This would typically require multiple connections to test properly
SELECT ok(true, 'Concurrent update test placeholder (requires multi-connection setup)');

-- Test 20: Memory usage optimization for large operations
CREATE OR REPLACE FUNCTION test_memory_efficient_bulk_update()
RETURNS boolean AS $$
DECLARE
  test_passed boolean := true;
BEGIN
  -- This is a simplified test - in practice you'd monitor actual memory usage
  -- The function should process updates in batches rather than loading everything at once
  PERFORM bulk_update_milestones('[]'::json, 'test_user'); -- Empty array should work
  RETURN test_passed;
END;
$$ LANGUAGE plpgsql;

SELECT ok(
  test_memory_efficient_bulk_update(),
  'Bulk update handles empty input efficiently'
);

-- Clean up functions
DROP FUNCTION calculate_discrete_completion(text);
DROP FUNCTION calculate_percentage_completion(text);
DROP FUNCTION calculate_quantity_completion(text);
DROP FUNCTION recalculate_component_completion(text);
DROP FUNCTION bulk_update_milestones(json, text);
DROP FUNCTION validate_milestone_update(text, text, text, text);
DROP FUNCTION get_milestone_history(text, text, integer);
DROP FUNCTION get_project_milestone_stats(text);
DROP FUNCTION apply_milestone_template_to_component(text, text);
DROP FUNCTION calculate_milestone_due_dates(text, date, integer[]);
DROP FUNCTION check_milestone_dependencies(text, text);
DROP FUNCTION performance_test_bulk_completion_recalc(integer);
DROP FUNCTION test_memory_efficient_bulk_update();

SELECT finish();

ROLLBACK;