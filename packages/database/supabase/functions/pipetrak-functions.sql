-- PipeTrak Supabase RPC Functions
-- Core business logic for component progress tracking

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
  IF v_workflow_type = 'milestone_discrete' THEN
    -- For discrete milestones, calculate based on completed milestones with weights
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN cm."isCompleted" THEN 
            (mt.milestones->cm."milestoneOrder"->>'weight')::numeric
          ELSE 0 
        END
      ), 0),
      COALESCE(SUM((mt.milestones->cm."milestoneOrder"->>'weight')::numeric), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    JOIN component c ON cm."componentId" = c.id
    JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
    WHERE cm."componentId" = p_component_id;

    v_completion := (v_weighted_completion / NULLIF(v_total_weight, 0)) * 100;

  ELSIF v_workflow_type = 'milestone_percentage' THEN
    -- For percentage milestones, average the percentages with weights
    SELECT 
      COALESCE(SUM(
        cm.percentageComplete * (mt.milestones->cm."milestoneOrder"->>'weight')::numeric
      ), 0),
      COALESCE(SUM((mt.milestones->cm."milestoneOrder"->>'weight')::numeric), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    JOIN component c ON cm."componentId" = c.id
    JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
    WHERE cm."componentId" = p_component_id;

    v_completion := v_weighted_completion / NULLIF(v_total_weight, 0);

  ELSIF v_workflow_type = 'milestone_quantity' THEN
    -- For quantity milestones, calculate based on quantities completed
    SELECT 
      COALESCE(SUM(
        (cm.quantityComplete / NULLIF(cm.quantityTotal, 0)) * 
        (mt.milestones->cm."milestoneOrder"->>'weight')::numeric * 100
      ), 0),
      COALESCE(SUM((mt.milestones->cm."milestoneOrder"->>'weight')::numeric), 1)
    INTO v_weighted_completion, v_total_weight
    FROM "ComponentMilestone" cm
    JOIN component c ON cm."componentId" = c.id
    JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
    WHERE cm."componentId" = p_component_id
    AND cm.quantityTotal > 0;

    v_completion := v_weighted_completion / NULLIF(v_total_weight, 0);

  ELSE
    v_completion := 0;
  END IF;

  -- Ensure completion is between 0 and 100
  v_completion := LEAST(GREATEST(v_completion, 0), 100);

  -- Update the component's completion percentage
  UPDATE "Component" 
  SET "completionPercent" = v_completion,
      updatedAt = NOW()
  WHERE id = p_component_id;

  RETURN v_completion;
END;
$$;

-- Function to update a component milestone and recalculate completion
CREATE OR REPLACE FUNCTION update_component_milestone(
  p_component_id text,
  p_milestone_name text,
  p_is_complete boolean DEFAULT NULL,
  p_percentage_complete numeric DEFAULT NULL,
  p_quantity_complete numeric DEFAULT NULL,
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
  v_milestone_index integer;
BEGIN
  -- Get workflow type
  SELECT workflowType INTO v_workflow_type
  FROM component
  WHERE id = p_component_id;

  -- Find the milestone by name and component
  SELECT cm.id, cm."milestoneOrder" INTO v_milestone_id, v_milestone_index
  FROM "ComponentMilestone" cm
  WHERE cm."componentId" = p_component_id
  AND cm.milestoneName = p_milestone_name;

  IF v_milestone_id IS NULL THEN
    RAISE EXCEPTION 'Milestone % not found for component %', p_milestone_name, p_component_id;
  END IF;

  -- Store old values for audit log
  SELECT json_build_object(
    'isComplete', isComplete,
    'percentageComplete', percentageComplete,
    'quantityComplete', quantityComplete
  ) INTO v_old_value
  FROM component_milestone
  WHERE id = v_milestone_id;

  -- Update based on workflow type
  IF v_workflow_type = 'milestone_discrete' AND p_is_complete IS NOT NULL THEN
    UPDATE "Component"_milestone
    SET isComplete = p_is_complete,
        completedAt = CASE WHEN p_is_complete THEN NOW() ELSE NULL END,
        completedByUserId = CASE WHEN p_is_complete THEN COALESCE(p_user_id, auth.uid()::text) ELSE NULL END
    WHERE id = v_milestone_id;

  ELSIF v_workflow_type = 'milestone_percentage' AND p_percentage_complete IS NOT NULL THEN
    UPDATE "Component"_milestone
    SET percentageComplete = p_percentage_complete,
        isComplete = (p_percentage_complete >= 100),
        completedAt = CASE WHEN p_percentage_complete >= 100 THEN NOW() ELSE NULL END,
        completedByUserId = CASE WHEN p_percentage_complete >= 100 THEN COALESCE(p_user_id, auth.uid()::text) ELSE NULL END
    WHERE id = v_milestone_id;

  ELSIF v_workflow_type = 'milestone_quantity' AND p_quantity_complete IS NOT NULL THEN
    UPDATE "Component"_milestone
    SET quantityComplete = p_quantity_complete,
        isComplete = (quantityComplete >= quantityTotal),
        completedAt = CASE WHEN quantityComplete >= quantityTotal THEN NOW() ELSE NULL END,
        completedByUserId = CASE WHEN quantityComplete >= quantityTotal THEN COALESCE(p_user_id, auth.uid()::text) ELSE NULL END
    WHERE id = v_milestone_id
    RETURNING (quantityComplete >= quantityTotal) INTO p_is_complete;

  ELSE
    RAISE EXCEPTION 'Invalid update parameters for workflow type %', v_workflow_type;
  END IF;

  -- Get new values for audit log
  SELECT json_build_object(
    'isComplete', isComplete,
    'percentageComplete', percentageComplete,
    'quantityComplete', quantityComplete
  ) INTO v_new_value
  FROM component_milestone
  WHERE id = v_milestone_id;

  -- Create audit log entry
  INSERT INTO audit_log (
    projectId, entityType, entityId, action, 
    oldValue, newValue, performedByUserId
  )
  SELECT c.projectId, 'component_milestone', v_milestone_id, 'UPDATE',
         v_old_value, v_new_value, COALESCE(p_user_id, auth.uid()::text)
  FROM "Component" c
  WHERE c.id = p_component_id;

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
    v_result := update_component_milestone(
      (v_update->>'componentId'),
      v_update->>'milestoneName',
      (v_update->>'isComplete')::boolean,
      (v_update->>'percentageComplete')::numeric,
      (v_update->>'quantityComplete')::numeric,
      auth.uid()::text
    );
    
    v_results := array_append(v_results, v_result);
    v_component_ids := array_append(v_component_ids, (v_update->>'componentId'));
  END LOOP;

  -- Update status for all affected components
  UPDATE "Component"
  SET status = CASE 
    WHEN completionPercent = 0 THEN 'NOT_STARTED'
    WHEN completionPercent < 100 THEN 'IN_PROGRESS'
    ELSE 'COMPLETED'
  END
  WHERE id = ANY(v_component_ids);

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
      AVG(completionPercent) as avg_completion,
      COUNT(DISTINCT area) as areas,
      COUNT(DISTINCT system) as systems,
      COUNT(DISTINCT testPackage) as test_packages
    FROM component
    WHERE projectId = p_project_id
  ),
  area_progress AS (
    SELECT 
      area,
      COUNT(*) as component_count,
      AVG(completionPercent) as avg_completion
    FROM component
    WHERE projectId = p_project_id
    AND area IS NOT NULL
    GROUP BY area
  ),
  system_progress AS (
    SELECT 
      system,
      COUNT(*) as component_count,
      AVG(completionPercent) as avg_completion
    FROM component
    WHERE projectId = p_project_id
    AND system IS NOT NULL
    GROUP BY system
  ),
  recent_updates AS (
    SELECT 
      json_agg(
        json_build_object(
          'componentId', c.componentId,
          'action', 'milestone_update',
          'timestamp', cm.completedAt,
          'milestone', cm.milestoneName,
          'user', u.name
        ) ORDER BY cm.completedAt DESC
      ) as updates
    FROM "ComponentMilestone" cm
    JOIN component c ON cm.componentId = c.id
    LEFT JOIN "user" u ON cm.completedByUserId = u.id
    WHERE c.projectId = p_project_id
    AND cm.completedAt IS NOT NULL
    AND cm.completedAt > NOW() - INTERVAL '7 days'
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
BEGIN
  -- Get component details
  SELECT c."workflowType", c."milestoneTemplateId", mt.milestones
  INTO v_workflow_type, v_template_id, v_milestones
  FROM "Component" c
  JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
  WHERE c.id = p_component_id;

  -- Delete existing milestones if any
  DELETE FROM component_milestone WHERE componentId = p_component_id;

  -- Create milestones from template
  FOR v_milestone IN SELECT * FROM json_array_elements(v_milestones)
  LOOP
    INSERT INTO "ComponentMilestone" (
      "componentId", "milestoneOrder", "milestoneName",
      "isCompleted", "percentageComplete", "quantityComplete", "quantityTotal"
    )
    VALUES (
      p_component_id,
      v_index,
      v_milestone->>'name',
      false,
      CASE WHEN v_workflow_type = 'milestone_percentage' THEN 0 ELSE NULL END,
      CASE WHEN v_workflow_type = 'milestone_quantity' THEN 0 ELSE NULL END,
      CASE WHEN v_workflow_type = 'milestone_quantity' THEN 
        (SELECT totalQuantity FROM component WHERE id = p_component_id)
      ELSE NULL END
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

-- Create the trigger
DROP TRIGGER IF EXISTS component_initialize_milestones ON component;
CREATE TRIGGER component_initialize_milestones
  AFTER INSERT ON component
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
BEGIN
  -- Get import job data
  SELECT data, projectId INTO v_job_data, v_project_id
  FROM import_job
  WHERE id = p_import_job_id
  AND status = 'PENDING';

  IF v_job_data IS NULL THEN
    RAISE EXCEPTION 'Import job % not found or not pending', p_import_job_id;
  END IF;

  -- Update job status to processing
  UPDATE import_job
  SET status = 'PROCESSING',
      processedAt = NOW()
  WHERE id = p_import_job_id;

  -- Process each component in the import data
  FOR v_component IN SELECT * FROM json_array_elements(v_job_data->'components')
  LOOP
    BEGIN
      -- Insert or update component
      INSERT INTO "Component" (
        "projectId", "componentId", type, "workflowType",
        spec, size, material, area, system, "testPackage",
        "drawingId", "milestoneTemplateId"
      )
      VALUES (
        v_project_id,
        v_component->>'componentId',
        v_component->>'type',
        v_component->>'workflowType',
        v_component->>'spec',
        v_component->>'size',
        v_component->>'material',
        v_component->>'area',
        v_component->>'system',
        v_component->>'testPackage',
        (v_component->>'drawingId'),
        (v_component->>'milestoneTemplateId')
      )
      ON CONFLICT (projectId, componentId) 
      DO UPDATE SET
        type = EXCLUDED.type,
        spec = EXCLUDED.spec,
        size = EXCLUDED.size,
        material = EXCLUDED.material,
        area = EXCLUDED.area,
        system = EXCLUDED.system,
        testPackage = EXCLUDED.testPackage,
        updatedAt = NOW();

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
  UPDATE import_job
  SET status = CASE 
        WHEN v_error_count = 0 THEN 'COMPLETED'
        WHEN v_success_count = 0 THEN 'FAILED'
        ELSE 'PARTIAL'
      END,
      completedAt = NOW(),
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