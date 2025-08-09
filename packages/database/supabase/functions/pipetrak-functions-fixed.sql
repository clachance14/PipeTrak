-- PipeTrak Supabase RPC Functions
-- Core business logic for component progress tracking
-- Fixed version with correct PascalCase table names

-- Function to calculate component completion based on milestone weights
CREATE OR REPLACE FUNCTION calculate_component_completion(p_component_id text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workflow_type text;
  v_completion numeric;
  v_total_weight numeric;
  v_weighted_completion numeric;
BEGIN
  -- Get the workflow type for this component
  SELECT c."workflowType" INTO v_workflow_type
  FROM "Component" c
  WHERE c.id = p_component_id;

  IF v_workflow_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate based on workflow type
  IF v_workflow_type = 'MILESTONE_DISCRETE' THEN
    -- For discrete milestones, calculate based on completed milestones with weights
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN cm."isCompleted" THEN cm.weight
          ELSE 0 
        END
      ), 0),
      COALESCE(SUM(cm.weight), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = p_component_id;

    v_completion := (v_weighted_completion / NULLIF(v_total_weight, 0)) * 100;

  ELSIF v_workflow_type = 'MILESTONE_PERCENTAGE' THEN
    -- For percentage milestones, average the percentages with weights
    SELECT 
      COALESCE(SUM(
        COALESCE(cm."percentageValue", 0) * cm.weight
      ), 0),
      COALESCE(SUM(cm.weight), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = p_component_id;

    v_completion := v_weighted_completion / NULLIF(v_total_weight, 0);

  ELSIF v_workflow_type = 'MILESTONE_QUANTITY' THEN
    -- For quantity milestones, calculate based on quantities completed
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN cm."quantityValue" IS NOT NULL AND cm."quantityValue" > 0 THEN
            (cm."quantityValue" / NULLIF(c."totalQuantity", 0)) * cm.weight * 100
          ELSE 0
        END
      ), 0),
      COALESCE(SUM(cm.weight), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    JOIN "Component" c ON cm."componentId" = c.id
    WHERE cm."componentId" = p_component_id;

    v_completion := v_weighted_completion / NULLIF(v_total_weight, 0);

  ELSE
    v_completion := 0;
  END IF;

  -- Ensure completion is between 0 and 100
  v_completion := LEAST(GREATEST(v_completion, 0), 100);

  -- Update the component's completion percentage and status
  UPDATE "Component" 
  SET "completionPercent" = v_completion,
      status = CASE 
        WHEN v_completion = 0 THEN 'NOT_STARTED'::"ComponentStatus"
        WHEN v_completion < 100 THEN 'IN_PROGRESS'::"ComponentStatus"
        ELSE 'COMPLETED'::"ComponentStatus"
      END,
      "updatedAt" = NOW()
  WHERE id = p_component_id;

  RETURN v_completion;
END;
$$;

-- Function to update a component milestone and recalculate completion
CREATE OR REPLACE FUNCTION update_component_milestone(
  p_component_id text,
  p_milestone_name text,
  p_is_complete boolean DEFAULT NULL,
  p_percentage_value numeric DEFAULT NULL,
  p_quantity_value numeric DEFAULT NULL,
  p_user_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_milestone_id text;
  v_workflow_type text;
  v_old_value json;
  v_new_value json;
  v_completion numeric;
  v_project_id text;
BEGIN
  -- Get workflow type and project ID
  SELECT "workflowType", "projectId" INTO v_workflow_type, v_project_id
  FROM "Component"
  WHERE id = p_component_id;

  -- Find the milestone by name and component
  SELECT cm.id INTO v_milestone_id
  FROM "ComponentMilestone" cm
  WHERE cm."componentId" = p_component_id
  AND cm."milestoneName" = p_milestone_name;

  IF v_milestone_id IS NULL THEN
    RAISE EXCEPTION 'Milestone % not found for component %', p_milestone_name, p_component_id;
  END IF;

  -- Store old values for audit log
  SELECT json_build_object(
    'isCompleted', "isCompleted",
    'percentageValue', "percentageValue",
    'quantityValue', "quantityValue"
  ) INTO v_old_value
  FROM "ComponentMilestone"
  WHERE id = v_milestone_id;

  -- Update based on workflow type
  IF v_workflow_type = 'MILESTONE_DISCRETE' AND p_is_complete IS NOT NULL THEN
    UPDATE "ComponentMilestone"
    SET "isCompleted" = p_is_complete,
        "completedAt" = CASE WHEN p_is_complete THEN NOW() ELSE NULL END,
        "completedBy" = CASE WHEN p_is_complete THEN COALESCE(p_user_id, current_setting('request.jwt.claims', true)::json->>'sub') ELSE NULL END,
        "updatedAt" = NOW()
    WHERE id = v_milestone_id;

  ELSIF v_workflow_type = 'MILESTONE_PERCENTAGE' AND p_percentage_value IS NOT NULL THEN
    UPDATE "ComponentMilestone"
    SET "percentageValue" = p_percentage_value,
        "isCompleted" = (p_percentage_value >= 100),
        "completedAt" = CASE WHEN p_percentage_value >= 100 THEN NOW() ELSE NULL END,
        "completedBy" = CASE WHEN p_percentage_value >= 100 THEN COALESCE(p_user_id, current_setting('request.jwt.claims', true)::json->>'sub') ELSE NULL END,
        "updatedAt" = NOW()
    WHERE id = v_milestone_id;

  ELSIF v_workflow_type = 'MILESTONE_QUANTITY' AND p_quantity_value IS NOT NULL THEN
    UPDATE "ComponentMilestone"
    SET "quantityValue" = p_quantity_value,
        "isCompleted" = (p_quantity_value >= (SELECT "totalQuantity" FROM "Component" WHERE id = p_component_id)),
        "completedAt" = CASE 
          WHEN p_quantity_value >= (SELECT "totalQuantity" FROM "Component" WHERE id = p_component_id) 
          THEN NOW() 
          ELSE NULL 
        END,
        "completedBy" = CASE 
          WHEN p_quantity_value >= (SELECT "totalQuantity" FROM "Component" WHERE id = p_component_id)
          THEN COALESCE(p_user_id, current_setting('request.jwt.claims', true)::json->>'sub')
          ELSE NULL 
        END,
        "updatedAt" = NOW()
    WHERE id = v_milestone_id;

  ELSE
    RAISE EXCEPTION 'Invalid update parameters for workflow type %', v_workflow_type;
  END IF;

  -- Get new values for audit log
  SELECT json_build_object(
    'isCompleted', "isCompleted",
    'percentageValue', "percentageValue",
    'quantityValue', "quantityValue"
  ) INTO v_new_value
  FROM "ComponentMilestone"
  WHERE id = v_milestone_id;

  -- Create audit log entry
  INSERT INTO "AuditLog" (
    "projectId", "entityType", "entityId", "action", 
    "changes", "userId", "timestamp"
  )
  VALUES (
    v_project_id, 
    'component_milestone', 
    v_milestone_id, 
    'UPDATE',
    json_build_object('old', v_old_value, 'new', v_new_value),
    COALESCE(p_user_id, current_setting('request.jwt.claims', true)::json->>'sub'),
    NOW()
  );

  -- Recalculate component completion
  v_completion := calculate_component_completion(p_component_id);

  -- Return updated milestone data with new completion
  RETURN json_build_object(
    'milestoneId', v_milestone_id,
    'componentId', p_component_id,
    'oldValue', v_old_value,
    'newValue', v_new_value,
    'componentCompletion', v_completion
  );
END;
$$;

-- Function to bulk update multiple milestones
CREATE OR REPLACE FUNCTION bulk_update_milestones(
  p_updates json[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_update json;
  v_result json;
  v_results json[] := '{}';
  v_component_ids text[] := '{}';
  v_component_id text;
BEGIN
  -- Process each update
  FOREACH v_update IN ARRAY p_updates
  LOOP
    BEGIN
      v_result := update_component_milestone(
        (v_update->>'componentId')::text,
        (v_update->>'milestoneName')::text,
        (v_update->>'isCompleted')::boolean,
        (v_update->>'percentageValue')::numeric,
        (v_update->>'quantityValue')::numeric,
        current_setting('request.jwt.claims', true)::json->>'sub'
      );
      
      v_results := array_append(v_results, v_result);
      v_component_ids := array_append(v_component_ids, (v_update->>'componentId')::text);
    EXCEPTION WHEN OTHERS THEN
      v_results := array_append(v_results, json_build_object(
        'error', SQLERRM,
        'componentId', v_update->>'componentId',
        'milestoneName', v_update->>'milestoneName'
      ));
    END;
  END LOOP;

  RETURN json_build_object(
    'updates', v_results,
    'totalUpdated', array_length(v_results, 1)
  );
END;
$$;

-- Function to get project progress summary
CREATE OR REPLACE FUNCTION get_project_progress(p_project_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result json;
BEGIN
  WITH component_stats AS (
    SELECT 
      COUNT(*) as total_components,
      COUNT(*) FILTER (WHERE status = 'NOT_STARTED') as not_started,
      COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
      AVG("completionPercent") as avg_completion,
      COUNT(DISTINCT area) as areas,
      COUNT(DISTINCT system) as systems,
      COUNT(DISTINCT "testPackage") as test_packages
    FROM "Component"
    WHERE "projectId" = p_project_id
  ),
  area_progress AS (
    SELECT 
      area,
      COUNT(*) as component_count,
      AVG("completionPercent") as avg_completion
    FROM "Component"
    WHERE "projectId" = p_project_id
    AND area IS NOT NULL
    GROUP BY area
  ),
  system_progress AS (
    SELECT 
      system,
      COUNT(*) as component_count,
      AVG("completionPercent") as avg_completion
    FROM "Component"
    WHERE "projectId" = p_project_id
    AND system IS NOT NULL
    GROUP BY system
  ),
  recent_updates AS (
    SELECT 
      json_agg(
        json_build_object(
          'componentId', c."componentId",
          'displayId', c."displayId",
          'action', 'milestone_update',
          'timestamp', cm."completedAt",
          'milestone', cm."milestoneName",
          'user', u.name
        ) ORDER BY cm."completedAt" DESC
      ) as updates
    FROM "ComponentMilestone" cm
    JOIN "Component" c ON cm."componentId" = c.id
    LEFT JOIN "user" u ON cm."completedBy" = u.id
    WHERE c."projectId" = p_project_id
    AND cm."completedAt" IS NOT NULL
    AND cm."completedAt" > NOW() - INTERVAL '7 days'
    LIMIT 20
  )
  SELECT json_build_object(
    'overall', (SELECT row_to_json(component_stats) FROM component_stats),
    'byArea', (SELECT json_agg(row_to_json(area_progress)) FROM area_progress),
    'bySystem', (SELECT json_agg(row_to_json(system_progress)) FROM system_progress),
    'recentUpdates', (SELECT updates FROM recent_updates)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to initialize milestones for a component
CREATE OR REPLACE FUNCTION initialize_component_milestones(p_component_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_milestone json;
  v_index integer := 0;
  v_workflow_type text;
  v_template_id text;
  v_milestones json;
  v_total_quantity numeric;
BEGIN
  -- Get component details
  SELECT c."workflowType", c."milestoneTemplateId", mt.milestones, c."totalQuantity"
  INTO v_workflow_type, v_template_id, v_milestones, v_total_quantity
  FROM "Component" c
  JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
  WHERE c.id = p_component_id;

  IF v_milestones IS NULL THEN
    RETURN;
  END IF;

  -- Delete existing milestones if any
  DELETE FROM "ComponentMilestone" WHERE "componentId" = p_component_id;

  -- Create milestones from template
  FOR v_milestone IN SELECT * FROM json_array_elements(v_milestones)
  LOOP
    INSERT INTO "ComponentMilestone" (
      "componentId", "milestoneOrder", "milestoneName",
      "weight", "isCompleted", "percentageValue", "quantityValue"
    )
    VALUES (
      p_component_id,
      v_index,
      v_milestone->>'name',
      COALESCE((v_milestone->>'weight')::numeric, 1.0),
      false,
      CASE WHEN v_workflow_type = 'MILESTONE_PERCENTAGE' THEN 0 ELSE NULL END,
      CASE WHEN v_workflow_type = 'MILESTONE_QUANTITY' THEN 0 ELSE NULL END
    );
    
    v_index := v_index + 1;
  END LOOP;
END;
$$;

-- Trigger to initialize milestones when a component is created
CREATE OR REPLACE FUNCTION trigger_initialize_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM initialize_component_milestones(NEW.id);
  RETURN NEW;
END;
$$;

-- Create the trigger (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS component_initialize_milestones ON "Component";
CREATE TRIGGER component_initialize_milestones
  AFTER INSERT ON "Component"
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_milestones();

-- Function to handle import job processing
CREATE OR REPLACE FUNCTION process_import_job(p_import_job_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_data json;
  v_component json;
  v_success_count integer := 0;
  v_error_count integer := 0;
  v_errors json[] := '{}';
  v_project_id text;
  v_component_id text;
BEGIN
  -- Get import job data
  SELECT data, "projectId" INTO v_job_data, v_project_id
  FROM "ImportJob"
  WHERE id = p_import_job_id
  AND status = 'PENDING';

  IF v_job_data IS NULL THEN
    RAISE EXCEPTION 'Import job % not found or not pending', p_import_job_id;
  END IF;

  -- Update job status to processing
  UPDATE "ImportJob"
  SET status = 'PROCESSING',
      "processedAt" = NOW()
  WHERE id = p_import_job_id;

  -- Process each component in the import data
  FOR v_component IN SELECT * FROM json_array_elements(v_job_data->'components')
  LOOP
    BEGIN
      -- Insert or update component
      INSERT INTO "Component" (
        "projectId", "componentId", "type", "workflowType",
        "spec", "size", "material", "area", "system", "testPackage",
        "drawingId", "milestoneTemplateId", "instanceNumber",
        "totalInstancesOnDrawing", "displayId", "status", "completionPercent"
      )
      VALUES (
        v_project_id,
        v_component->>'componentId',
        v_component->>'type',
        (v_component->>'workflowType')::text,
        v_component->>'spec',
        v_component->>'size',
        v_component->>'material',
        v_component->>'area',
        v_component->>'system',
        v_component->>'testPackage',
        v_component->>'drawingId',
        v_component->>'milestoneTemplateId',
        COALESCE((v_component->>'instanceNumber')::integer, 1),
        (v_component->>'totalInstancesOnDrawing')::integer,
        v_component->>'displayId',
        'NOT_STARTED'::"ComponentStatus",
        0
      )
      ON CONFLICT ("projectId", "drawingId", "componentId", "instanceNumber") 
      DO UPDATE SET
        "type" = EXCLUDED."type",
        "spec" = EXCLUDED."spec",
        "size" = EXCLUDED."size",
        "material" = EXCLUDED."material",
        "area" = EXCLUDED."area",
        "system" = EXCLUDED."system",
        "testPackage" = EXCLUDED."testPackage",
        "updatedAt" = NOW()
      RETURNING id INTO v_component_id;

      v_success_count := v_success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, json_build_object(
        'componentId', v_component->>'componentId',
        'error', SQLERRM
      ));
    END;
  END LOOP;

  -- Update job status
  UPDATE "ImportJob"
  SET status = CASE 
        WHEN v_error_count = 0 THEN 'COMPLETED'
        WHEN v_success_count = 0 THEN 'FAILED'
        ELSE 'PARTIAL'
      END,
      "completedAt" = NOW(),
      result = json_build_object(
        'successCount', v_success_count,
        'errorCount', v_error_count,
        'errors', v_errors
      )
  WHERE id = p_import_job_id;

  RETURN json_build_object(
    'jobId', p_import_job_id,
    'successCount', v_success_count,
    'errorCount', v_error_count,
    'errors', v_errors
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_component_completion TO authenticated;
GRANT EXECUTE ON FUNCTION update_component_milestone TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_milestones TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_progress TO authenticated;
GRANT EXECUTE ON FUNCTION process_import_job TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_component_milestones TO authenticated;

-- Add comment documentation
COMMENT ON FUNCTION calculate_component_completion IS 'Calculates and updates the completion percentage for a component based on its milestones and workflow type';
COMMENT ON FUNCTION update_component_milestone IS 'Updates a single milestone and recalculates component completion';
COMMENT ON FUNCTION bulk_update_milestones IS 'Updates multiple milestones in a single transaction';
COMMENT ON FUNCTION get_project_progress IS 'Returns comprehensive progress statistics for a project';
COMMENT ON FUNCTION process_import_job IS 'Processes a bulk import job for components';
COMMENT ON FUNCTION initialize_component_milestones IS 'Creates milestone records for a component based on its template';