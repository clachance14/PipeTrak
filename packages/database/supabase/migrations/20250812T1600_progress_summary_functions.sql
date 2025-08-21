-- Progress Summary Report Functions
-- Functions for calculating weekly progress reports with ROC weights and backdating support

-- Function to get the last Sunday (week ending date) for a given date
CREATE OR REPLACE FUNCTION get_week_ending_date(input_date DATE)
RETURNS DATE
LANGUAGE plpgsql
AS $$
BEGIN
    -- If input is already Sunday, return it, otherwise return previous Sunday
    IF EXTRACT(DOW FROM input_date) = 0 THEN
        RETURN input_date;
    ELSE
        RETURN input_date - INTERVAL '1 day' * EXTRACT(DOW FROM input_date);
    END IF;
END;
$$;

-- Function to check if backdating is allowed (before Tuesday 9 AM cutoff)
CREATE OR REPLACE FUNCTION is_backdating_allowed(
    effective_date DATE,
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    last_sunday DATE;
    tuesday_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get last Sunday (end of reporting period)
    last_sunday := get_week_ending_date(check_timestamp::DATE);
    
    -- Calculate Tuesday 9 AM cutoff for the current week
    tuesday_cutoff := (last_sunday + INTERVAL '2 days')::DATE + TIME '09:00:00';
    
    -- Rule 1: Cannot future date
    IF effective_date > check_timestamp::DATE THEN
        RETURN FALSE;
    END IF;
    
    -- Rule 2: Cannot backdate beyond grace period
    IF check_timestamp > tuesday_cutoff AND effective_date < last_sunday THEN
        RETURN FALSE;
    END IF;
    
    -- Rule 3: Cannot modify data older than 1 week
    IF effective_date < (last_sunday - INTERVAL '7 days')::DATE THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Function to calculate milestone completion percentage for a component
CREATE OR REPLACE FUNCTION calculate_milestone_completion_percent(
    component_id_param TEXT,
    milestone_name_param TEXT,
    week_ending_date DATE
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
    milestone_record RECORD;
    completion_percent DECIMAL(5,2) := 0;
BEGIN
    -- Get the milestone record with effective date <= week ending
    SELECT 
        cm."isCompleted",
        cm."percentageValue",
        c."workflowType"
    INTO milestone_record
    FROM "ComponentMilestone" cm
    JOIN "Component" c ON c.id = cm."componentId"
    WHERE cm."componentId" = component_id_param
      AND cm."milestoneName" = milestone_name_param
      AND cm."effectiveDate" <= week_ending_date
    ORDER BY cm."effectiveDate" DESC, cm."updatedAt" DESC
    LIMIT 1;
    
    -- Calculate completion percentage based on workflow type
    IF milestone_record IS NOT NULL THEN
        CASE milestone_record."workflowType"
            WHEN 'MILESTONE_DISCRETE' THEN
                completion_percent := CASE WHEN milestone_record."isCompleted" THEN 100 ELSE 0 END;
            WHEN 'MILESTONE_PERCENTAGE' THEN
                completion_percent := COALESCE(milestone_record."percentageValue", 0);
            ELSE
                completion_percent := CASE WHEN milestone_record."isCompleted" THEN 100 ELSE 0 END;
        END CASE;
    END IF;
    
    RETURN completion_percent;
END;
$$;

-- Function to calculate progress by area for a project and week
CREATE OR REPLACE FUNCTION calculate_progress_by_area(
    project_id_param TEXT,
    week_ending_date DATE
)
RETURNS TABLE(
    area TEXT,
    component_count BIGINT,
    received_percent DECIMAL(5,2),
    installed_percent DECIMAL(5,2),
    punched_percent DECIMAL(5,2),
    tested_percent DECIMAL(5,2),
    restored_percent DECIMAL(5,2),
    overall_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH component_progress AS (
        SELECT 
            c.area,
            c.id as component_id,
            calculate_milestone_completion_percent(c.id, 'Receive', week_ending_date) as received,
            calculate_milestone_completion_percent(c.id, 'Install', week_ending_date) as installed,
            calculate_milestone_completion_percent(c.id, 'Punch', week_ending_date) as punched,
            calculate_milestone_completion_percent(c.id, 'Test', week_ending_date) as tested,
            calculate_milestone_completion_percent(c.id, 'Restore', week_ending_date) as restored
        FROM "Component" c
        WHERE c."projectId" = project_id_param
          AND c.area IS NOT NULL
    )
    SELECT 
        cp.area::TEXT,
        COUNT(cp.component_id) as component_count,
        ROUND(AVG(cp.received), 2) as received_percent,
        ROUND(AVG(cp.installed), 2) as installed_percent,
        ROUND(AVG(cp.punched), 2) as punched_percent,
        ROUND(AVG(cp.tested), 2) as tested_percent,
        ROUND(AVG(cp.restored), 2) as restored_percent,
        ROUND((AVG(cp.received) + AVG(cp.installed) + AVG(cp.punched) + AVG(cp.tested) + AVG(cp.restored)) / 5, 2) as overall_percent
    FROM component_progress cp
    GROUP BY cp.area
    ORDER BY cp.area;
END;
$$;

-- Function to calculate progress by system for a project and week  
CREATE OR REPLACE FUNCTION calculate_progress_by_system(
    project_id_param TEXT,
    week_ending_date DATE
)
RETURNS TABLE(
    system TEXT,
    component_count BIGINT,
    received_percent DECIMAL(5,2),
    installed_percent DECIMAL(5,2),
    punched_percent DECIMAL(5,2),
    tested_percent DECIMAL(5,2),
    restored_percent DECIMAL(5,2),
    overall_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH component_progress AS (
        SELECT 
            c.system,
            c.id as component_id,
            calculate_milestone_completion_percent(c.id, 'Receive', week_ending_date) as received,
            calculate_milestone_completion_percent(c.id, 'Install', week_ending_date) as installed,
            calculate_milestone_completion_percent(c.id, 'Punch', week_ending_date) as punched,
            calculate_milestone_completion_percent(c.id, 'Test', week_ending_date) as tested,
            calculate_milestone_completion_percent(c.id, 'Restore', week_ending_date) as restored
        FROM "Component" c
        WHERE c."projectId" = project_id_param
          AND c.system IS NOT NULL
    )
    SELECT 
        cp.system::TEXT,
        COUNT(cp.component_id) as component_count,
        ROUND(AVG(cp.received), 2) as received_percent,
        ROUND(AVG(cp.installed), 2) as installed_percent,
        ROUND(AVG(cp.punched), 2) as punched_percent,
        ROUND(AVG(cp.tested), 2) as tested_percent,
        ROUND(AVG(cp.restored), 2) as restored_percent,
        ROUND((AVG(cp.received) + AVG(cp.installed) + AVG(cp.punched) + AVG(cp.tested) + AVG(cp.restored)) / 5, 2) as overall_percent
    FROM component_progress cp
    GROUP BY cp.system
    ORDER BY cp.system;
END;
$$;

-- Function to calculate progress by test package for a project and week
CREATE OR REPLACE FUNCTION calculate_progress_by_test_package(
    project_id_param TEXT,
    week_ending_date DATE
)
RETURNS TABLE(
    test_package TEXT,
    component_count BIGINT,
    received_percent DECIMAL(5,2),
    installed_percent DECIMAL(5,2),
    punched_percent DECIMAL(5,2),
    tested_percent DECIMAL(5,2),
    restored_percent DECIMAL(5,2),
    overall_percent DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH component_progress AS (
        SELECT 
            c."testPackage",
            c.id as component_id,
            calculate_milestone_completion_percent(c.id, 'Receive', week_ending_date) as received,
            calculate_milestone_completion_percent(c.id, 'Install', week_ending_date) as installed,
            calculate_milestone_completion_percent(c.id, 'Punch', week_ending_date) as punched,
            calculate_milestone_completion_percent(c.id, 'Test', week_ending_date) as tested,
            calculate_milestone_completion_percent(c.id, 'Restore', week_ending_date) as restored
        FROM "Component" c
        WHERE c."projectId" = project_id_param
          AND c."testPackage" IS NOT NULL
    )
    SELECT 
        cp."testPackage"::TEXT,
        COUNT(cp.component_id) as component_count,
        ROUND(AVG(cp.received), 2) as received_percent,
        ROUND(AVG(cp.installed), 2) as installed_percent,
        ROUND(AVG(cp.punched), 2) as punched_percent,
        ROUND(AVG(cp.tested), 2) as tested_percent,
        ROUND(AVG(cp.restored), 2) as restored_percent,
        ROUND((AVG(cp.received) + AVG(cp.installed) + AVG(cp.punched) + AVG(cp.tested) + AVG(cp.restored)) / 5, 2) as overall_percent
    FROM component_progress cp
    GROUP BY cp."testPackage"
    ORDER BY cp."testPackage";
END;
$$;

-- Function to generate and store a progress snapshot
CREATE OR REPLACE FUNCTION generate_progress_snapshot(
    project_id_param TEXT,
    snapshot_date_param DATE,
    generated_by_param TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    snapshot_id TEXT;
    calculation_start TIMESTAMP;
    calculation_duration INTEGER;
    total_components INTEGER;
    completed_components INTEGER;
    area_breakdown JSONB;
    system_breakdown JSONB;
    test_package_breakdown JSONB;
BEGIN
    calculation_start := NOW();
    
    -- Get total and completed component counts
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN c."completionPercent" >= 100 THEN 1 END)
    INTO total_components, completed_components
    FROM "Component" c
    WHERE c."projectId" = project_id_param;
    
    -- Calculate area breakdown
    SELECT jsonb_agg(
        jsonb_build_object(
            'area', area,
            'componentCount', component_count,
            'completionPercent', overall_percent,
            'milestones', jsonb_build_object(
                'received', received_percent,
                'installed', installed_percent,
                'punched', punched_percent,
                'tested', tested_percent,
                'restored', restored_percent
            )
        )
    )
    INTO area_breakdown
    FROM calculate_progress_by_area(project_id_param, snapshot_date_param);
    
    -- Calculate system breakdown
    SELECT jsonb_agg(
        jsonb_build_object(
            'system', system,
            'componentCount', component_count,
            'completionPercent', overall_percent,
            'milestones', jsonb_build_object(
                'received', received_percent,
                'installed', installed_percent,
                'punched', punched_percent,
                'tested', tested_percent,
                'restored', restored_percent
            )
        )
    )
    INTO system_breakdown
    FROM calculate_progress_by_system(project_id_param, snapshot_date_param);
    
    -- Calculate test package breakdown
    SELECT jsonb_agg(
        jsonb_build_object(
            'testPackage', test_package,
            'componentCount', component_count,
            'completionPercent', overall_percent,
            'milestones', jsonb_build_object(
                'received', received_percent,
                'installed', installed_percent,
                'punched', punched_percent,
                'tested', tested_percent,
                'restored', restored_percent
            ),
            'isReady', overall_percent >= 100
        )
    )
    INTO test_package_breakdown
    FROM calculate_progress_by_test_package(project_id_param, snapshot_date_param);
    
    calculation_duration := EXTRACT(EPOCH FROM (NOW() - calculation_start)) * 1000;
    
    -- Insert snapshot record
    INSERT INTO "ProgressSnapshots" (
        "projectId",
        "snapshotDate",
        "snapshotTime",
        "totalComponents",
        "completedComponents",
        "overallCompletionPercent",
        "rocWeightedPercent",
        "areaBreakdown",
        "systemBreakdown",
        "testPackageBreakdown",
        "calculationDuration",
        "generatedBy",
        "generationMethod"
    )
    VALUES (
        project_id_param,
        snapshot_date_param,
        NOW(),
        total_components,
        completed_components,
        ROUND((completed_components::DECIMAL / NULLIF(total_components, 0)) * 100, 2),
        ROUND((completed_components::DECIMAL / NULLIF(total_components, 0)) * 100, 2), -- Same as overall for MVP
        COALESCE(area_breakdown, '[]'::jsonb),
        COALESCE(system_breakdown, '[]'::jsonb),
        COALESCE(test_package_breakdown, '[]'::jsonb),
        calculation_duration,
        generated_by_param,
        'MANUAL'
    )
    RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_week_ending_date(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION is_backdating_allowed(DATE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_milestone_completion_percent(TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_progress_by_area(TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_progress_by_system(TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_progress_by_test_package(TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_progress_snapshot(TEXT, DATE, TEXT) TO authenticated;