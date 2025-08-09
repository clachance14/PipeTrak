-- PipeTrak Batch Import RPC Function
-- Provides atomic batch import capability with error recovery
-- This function processes component imports in a transaction-safe manner

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS import_component_batch(text, jsonb, text);

-- Create the batch import function
CREATE OR REPLACE FUNCTION import_component_batch(
    p_project_id text,
    p_components jsonb,
    p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_component_record jsonb;
    v_template_id text;
    v_template_milestones jsonb;
    v_drawing_id text;
    v_created_component_id text;
    v_milestone_def jsonb;
    v_milestone_order int;
    v_result jsonb;
    v_success_count integer := 0;
    v_error_count integer := 0;
    v_errors jsonb[] := '{}';
    v_component_id_text text;
    v_existing_component record;
BEGIN
    -- Validate project exists and user has access
    IF NOT EXISTS (
        SELECT 1 FROM "Project" p
        JOIN "Organization" o ON p."organizationId" = o.id
        JOIN "Member" m ON m."organizationId" = o.id
        WHERE p.id = p_project_id 
        AND m."userId" = p_user_id
    ) THEN
        RAISE EXCEPTION 'Project not found or access denied';
    END IF;

    -- Process each component in the batch
    FOR v_component_record IN SELECT * FROM jsonb_array_elements(p_components)
    LOOP
        BEGIN
            -- Extract component ID
            v_component_id_text := v_component_record->>'componentId';
            
            IF v_component_id_text IS NULL OR v_component_id_text = '' THEN
                RAISE EXCEPTION 'Component ID is required';
            END IF;

            -- Check for existing component
            SELECT * INTO v_existing_component
            FROM "Component"
            WHERE "projectId" = p_project_id
            AND "componentId" = v_component_id_text;

            -- Get milestone template ID (use provided or project default)
            v_template_id := v_component_record->>'milestoneTemplateId';
            IF v_template_id IS NULL THEN
                SELECT id INTO v_template_id
                FROM "MilestoneTemplate"
                WHERE "projectId" = p_project_id
                AND "isDefault" = true
                LIMIT 1;
            END IF;

            -- Get drawing ID if drawing number provided
            IF v_component_record->>'drawingNumber' IS NOT NULL THEN
                SELECT id INTO v_drawing_id
                FROM "Drawing"
                WHERE "projectId" = p_project_id
                AND "number" = v_component_record->>'drawingNumber'
                LIMIT 1;
            END IF;

            -- Insert or update component
            IF v_existing_component.id IS NULL THEN
                -- Insert new component
                INSERT INTO "Component" (
                    id,
                    "projectId",
                    "componentId",
                    type,
                    "workflowType",
                    spec,
                    size,
                    material,
                    area,
                    system,
                    "testPackage",
                    "drawingId",
                    "milestoneTemplateId",
                    status,
                    "completionPercent",
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    gen_random_uuid()::text,
                    p_project_id,
                    v_component_id_text,
                    COALESCE(v_component_record->>'type', 'PIPE'),
                    COALESCE(
                        (v_component_record->>'workflowType')::"WorkflowType",
                        'MILESTONE_DISCRETE'::"WorkflowType"
                    ),
                    COALESCE(v_component_record->>'spec', ''),
                    COALESCE(v_component_record->>'size', ''),
                    COALESCE(v_component_record->>'material', ''),
                    COALESCE(v_component_record->>'area', ''),
                    COALESCE(v_component_record->>'system', ''),
                    COALESCE(v_component_record->>'testPackage', ''),
                    v_drawing_id,
                    v_template_id,
                    'NOT_STARTED'::"ComponentStatus",
                    0,
                    now(),
                    now()
                ) RETURNING id INTO v_created_component_id;
            ELSE
                -- Update existing component if updateExisting flag is set
                IF COALESCE((v_component_record->>'updateExisting')::boolean, false) THEN
                    UPDATE "Component" SET
                        type = COALESCE(v_component_record->>'type', type),
                        spec = COALESCE(v_component_record->>'spec', spec),
                        size = COALESCE(v_component_record->>'size', size),
                        material = COALESCE(v_component_record->>'material', material),
                        area = COALESCE(v_component_record->>'area', area),
                        system = COALESCE(v_component_record->>'system', system),
                        "testPackage" = COALESCE(v_component_record->>'testPackage', "testPackage"),
                        "drawingId" = COALESCE(v_drawing_id, "drawingId"),
                        "updatedAt" = now()
                    WHERE id = v_existing_component.id
                    RETURNING id INTO v_created_component_id;
                ELSIF COALESCE((v_component_record->>'skipDuplicates')::boolean, false) THEN
                    -- Skip duplicate, but don't count as error
                    v_success_count := v_success_count + 1;
                    CONTINUE;
                ELSE
                    -- Duplicate found and not updating or skipping
                    RAISE EXCEPTION 'Component % already exists', v_component_id_text;
                END IF;
            END IF;

            -- Create milestones if this is a new component and template exists
            IF v_existing_component.id IS NULL AND v_template_id IS NOT NULL THEN
                -- Get milestone template
                SELECT milestones INTO v_template_milestones
                FROM "MilestoneTemplate"
                WHERE id = v_template_id;

                -- Create milestones from template
                v_milestone_order := 0;
                FOR v_milestone_def IN SELECT * FROM jsonb_array_elements(v_template_milestones)
                LOOP
                    INSERT INTO "ComponentMilestone" (
                        id,
                        "componentId",
                        "milestoneName",
                        "milestoneOrder",
                        weight,
                        "isCompleted",
                        "createdAt",
                        "updatedAt"
                    ) VALUES (
                        gen_random_uuid()::text,
                        v_created_component_id,
                        v_milestone_def->>'name',
                        v_milestone_order,
                        COALESCE((v_milestone_def->>'weight')::float, 20),
                        false,
                        now(),
                        now()
                    );
                    v_milestone_order := v_milestone_order + 1;
                END LOOP;
            END IF;

            -- Process provided milestones if any
            IF v_component_record->'milestones' IS NOT NULL AND 
               jsonb_array_length(v_component_record->'milestones') > 0 THEN
                
                -- Delete existing milestones if updating
                IF v_existing_component.id IS NOT NULL THEN
                    DELETE FROM "ComponentMilestone"
                    WHERE "componentId" = v_created_component_id;
                END IF;

                -- Insert provided milestones
                v_milestone_order := 0;
                FOR v_milestone_def IN SELECT * FROM jsonb_array_elements(v_component_record->'milestones')
                LOOP
                    INSERT INTO "ComponentMilestone" (
                        id,
                        "componentId",
                        "milestoneName",
                        "milestoneOrder",
                        weight,
                        "isCompleted",
                        "percentageValue",
                        "quantityValue",
                        "quantityUnit",
                        "completedAt",
                        "completedBy",
                        "createdAt",
                        "updatedAt"
                    ) VALUES (
                        gen_random_uuid()::text,
                        v_created_component_id,
                        v_milestone_def->>'name',
                        v_milestone_order,
                        COALESCE((v_milestone_def->>'weight')::float, 20),
                        COALESCE(
                            (v_milestone_def->>'completed')::boolean,
                            (v_milestone_def->>'isCompleted')::boolean,
                            false
                        ),
                        (v_milestone_def->>'percentageValue')::float,
                        (v_milestone_def->>'quantityValue')::float,
                        v_milestone_def->>'quantityUnit',
                        CASE 
                            WHEN COALESCE(
                                (v_milestone_def->>'completed')::boolean,
                                (v_milestone_def->>'isCompleted')::boolean,
                                false
                            ) THEN 
                                COALESCE(
                                    (v_milestone_def->>'completedDate')::timestamp,
                                    now()
                                )
                            ELSE NULL
                        END,
                        CASE 
                            WHEN COALESCE(
                                (v_milestone_def->>'completed')::boolean,
                                (v_milestone_def->>'isCompleted')::boolean,
                                false
                            ) THEN p_user_id
                            ELSE NULL
                        END,
                        now(),
                        now()
                    );
                    v_milestone_order := v_milestone_order + 1;
                END LOOP;

                -- Update component completion status
                UPDATE "Component" 
                SET 
                    "completionPercent" = (
                        SELECT COALESCE(
                            ROUND(
                                100.0 * COUNT(*) FILTER (WHERE "isCompleted") / 
                                NULLIF(COUNT(*), 0)
                            ),
                            0
                        )
                        FROM "ComponentMilestone"
                        WHERE "componentId" = v_created_component_id
                    ),
                    status = CASE
                        WHEN (
                            SELECT COUNT(*) FILTER (WHERE "isCompleted")
                            FROM "ComponentMilestone"
                            WHERE "componentId" = v_created_component_id
                        ) = 0 THEN 'NOT_STARTED'::"ComponentStatus"
                        WHEN (
                            SELECT COUNT(*) FILTER (WHERE "isCompleted") = COUNT(*)
                            FROM "ComponentMilestone"
                            WHERE "componentId" = v_created_component_id
                        ) THEN 'COMPLETED'::"ComponentStatus"
                        ELSE 'IN_PROGRESS'::"ComponentStatus"
                    END
                WHERE id = v_created_component_id;
            END IF;

            v_success_count := v_success_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_errors := array_append(v_errors, jsonb_build_object(
                'componentId', v_component_id_text,
                'error', SQLERRM,
                'sqlstate', SQLSTATE
            ));
        END;
    END LOOP;

    -- Return results
    RETURN jsonb_build_object(
        'success', v_success_count,
        'errors', v_error_count,
        'errorDetails', array_to_json(v_errors)::jsonb,
        'totalProcessed', v_success_count + v_error_count
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION import_component_batch(text, jsonb, text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION import_component_batch IS 'Batch import components with atomic transaction support. Processes multiple components and returns success/error counts with detailed error information.';