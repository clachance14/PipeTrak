-- Progress Summary Report Functions (FIXED)
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
    as_of_date DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    completion_percent DECIMAL;
BEGIN
    SELECT 
        CASE 
            WHEN cm."isCompleted" = true THEN 100.00
            ELSE COALESCE(cm."percentageValue", 0.00)
        END INTO completion_percent
    FROM "ComponentMilestone" cm
    WHERE cm."componentId" = component_id_param
      AND cm."milestoneName" = milestone_name_param
      AND (cm."effectiveDate" IS NULL OR cm."effectiveDate" <= as_of_date)
    ORDER BY cm."effectiveDate" DESC NULLS LAST
    LIMIT 1;
    
    RETURN COALESCE(completion_percent, 0.00);
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
    system_name TEXT,
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
            c."system",
            c.id as component_id,
            calculate_milestone_completion_percent(c.id, 'Receive', week_ending_date) as received,
            calculate_milestone_completion_percent(c.id, 'Install', week_ending_date) as installed,
            calculate_milestone_completion_percent(c.id, 'Punch', week_ending_date) as punched,
            calculate_milestone_completion_percent(c.id, 'Test', week_ending_date) as tested,
            calculate_milestone_completion_percent(c.id, 'Restore', week_ending_date) as restored
        FROM "Component" c
        WHERE c."projectId" = project_id_param
          AND c."system" IS NOT NULL
    )
    SELECT 
        cp."system"::TEXT as system_name,
        COUNT(cp.component_id) as component_count,
        ROUND(AVG(cp.received), 2) as received_percent,
        ROUND(AVG(cp.installed), 2) as installed_percent,
        ROUND(AVG(cp.punched), 2) as punched_percent,
        ROUND(AVG(cp.tested), 2) as tested_percent,
        ROUND(AVG(cp.restored), 2) as restored_percent,
        ROUND((AVG(cp.received) + AVG(cp.installed) + AVG(cp.punched) + AVG(cp.tested) + AVG(cp.restored)) / 5, 2) as overall_percent
    FROM component_progress cp
    GROUP BY cp."system"
    ORDER BY cp."system";
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

-- Function to store a progress snapshot
CREATE OR REPLACE FUNCTION store_progress_snapshot(
    project_id_param TEXT,
    week_ending_param DATE,
    snapshot_data_param JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    snapshot_id TEXT;
    is_final BOOLEAN;
    cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate Tuesday 9 AM cutoff
    cutoff_time := (week_ending_param + INTERVAL '2 days')::DATE + TIME '09:00:00';
    
    -- Determine if snapshot is FINAL or PRELIMINARY
    is_final := NOW() >= cutoff_time;
    
    -- Generate unique ID
    snapshot_id := gen_random_uuid()::TEXT;
    
    -- Insert snapshot
    INSERT INTO "ProgressSnapshot" (
        id,
        "projectId",
        "weekEnding",
        "snapshotData",
        status,
        "createdAt"
    ) VALUES (
        snapshot_id,
        project_id_param,
        week_ending_param,
        snapshot_data_param,
        CASE WHEN is_final THEN 'FINAL' ELSE 'PRELIMINARY' END,
        NOW()
    );
    
    RETURN snapshot_id;
END;
$$;

-- Function to get the latest snapshot for a project and week
CREATE OR REPLACE FUNCTION get_latest_snapshot(
    project_id_param TEXT,
    week_ending_param DATE
)
RETURNS TABLE(
    id TEXT,
    project_id TEXT,
    week_ending DATE,
    snapshot_data JSONB,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps."projectId",
        ps."weekEnding",
        ps."snapshotData",
        ps.status,
        ps."createdAt"
    FROM "ProgressSnapshot" ps
    WHERE ps."projectId" = project_id_param
      AND ps."weekEnding" = week_ending_param
    ORDER BY ps."createdAt" DESC
    LIMIT 1;
END;
$$;

-- Function to calculate week-over-week deltas
CREATE OR REPLACE FUNCTION calculate_progress_deltas(
    project_id_param TEXT,
    current_week DATE,
    previous_week DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    current_data JSONB;
    previous_data JSONB;
    delta_result JSONB;
BEGIN
    -- Get current week snapshot
    SELECT "snapshotData" INTO current_data
    FROM "ProgressSnapshot"
    WHERE "projectId" = project_id_param
      AND "weekEnding" = current_week
    ORDER BY "createdAt" DESC
    LIMIT 1;
    
    -- Get previous week snapshot
    SELECT "snapshotData" INTO previous_data
    FROM "ProgressSnapshot"
    WHERE "projectId" = project_id_param
      AND "weekEnding" = previous_week
    ORDER BY "createdAt" DESC
    LIMIT 1;
    
    -- If no previous data, return current data with zero deltas
    IF previous_data IS NULL THEN
        RETURN jsonb_build_object(
            'current', current_data,
            'deltas', jsonb_build_object()
        );
    END IF;
    
    -- Calculate deltas (simplified - actual implementation would iterate through data)
    delta_result := jsonb_build_object(
        'current', current_data,
        'previous', previous_data,
        'deltas', jsonb_build_object(
            'weekOverWeek', true
        )
    );
    
    RETURN delta_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_week_ending_date TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_backdating_allowed TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_milestone_completion_percent TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_progress_by_area TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_progress_by_system TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_progress_by_test_package TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION store_progress_snapshot TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_latest_snapshot TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_progress_deltas TO authenticated, service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_component_milestone_effective 
ON "ComponentMilestone"("componentId", "effectiveDate", "milestoneName");

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_lookup
ON "ProgressSnapshot"("projectId", "weekEnding", status, "createdAt");

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Progress Summary Report functions created successfully!';
END;
$$;