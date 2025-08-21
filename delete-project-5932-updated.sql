-- Hard delete script for Project with Job Number 5932
-- Updated to handle FieldWeld and Welder tables
-- First, find the project ID(s) with this job number

-- Step 1: Find the project ID for job number 5932
SELECT id, "jobName", "jobNumber", "organizationId"
FROM public."Project"
WHERE "jobNumber" = '5932';

-- Once you have the project ID from above, use this complete deletion script
-- Replace 'PROJECT_ID_HERE' with the actual ID from the query above

BEGIN;

-- Store the project ID in a variable (PostgreSQL)
DO $$
DECLARE
    project_id_to_delete TEXT;
BEGIN
    -- Get the project ID for job number 5932
    SELECT id INTO project_id_to_delete
    FROM public."Project"
    WHERE "jobNumber" = '5932'
    LIMIT 1;

    IF project_id_to_delete IS NULL THEN
        RAISE NOTICE 'No project found with job number 5932';
    ELSE
        RAISE NOTICE 'Deleting project ID: %', project_id_to_delete;

        -- Delete Audit Logs
        DELETE FROM public."AuditLog" WHERE "projectId" = project_id_to_delete;

        -- Delete Component Milestones
        DELETE FROM public."ComponentMilestone"
        WHERE "componentId" IN (
            SELECT id FROM public."Component" WHERE "projectId" = project_id_to_delete
        );

        -- Delete Field Welds (MUST come before Components due to FK constraint)
        DELETE FROM public."field_weld" WHERE "projectId" = project_id_to_delete;

        -- Delete Components
        DELETE FROM public."Component" WHERE "projectId" = project_id_to_delete;

        -- Delete Welders (can be done after Field Welds are deleted)
        DELETE FROM public."welder" WHERE "projectId" = project_id_to_delete;

        -- Delete Drawings (handle hierarchy)
        UPDATE public."Drawing" SET "parentId" = NULL WHERE "projectId" = project_id_to_delete;
        DELETE FROM public."Drawing" WHERE "projectId" = project_id_to_delete;

        -- Delete Milestone Templates
        DELETE FROM public."MilestoneTemplate" WHERE "projectId" = project_id_to_delete;

        -- Delete Import Jobs
        DELETE FROM public."ImportJob" WHERE "projectId" = project_id_to_delete;

        -- Delete Report Generations
        DELETE FROM public."ReportGenerations" WHERE "projectId" = project_id_to_delete;

        -- Delete Progress Snapshots
        DELETE FROM public."ProgressSnapshots" WHERE "projectId" = project_id_to_delete;

        -- Delete ROC Configurations
        DELETE FROM public."ROCConfigurations" WHERE "projectId" = project_id_to_delete;

        -- Delete Reporting Cache
        DELETE FROM public."ReportingCache" WHERE "projectId" = project_id_to_delete;

        -- Finally delete the Project itself
        DELETE FROM public."Project" WHERE id = project_id_to_delete;

        RAISE NOTICE 'Project with job number 5932 (ID: %) has been deleted', project_id_to_delete;
    END IF;
END $$;

-- Verify deletion
SELECT
    'Project with Job Number 5932' as check,
    COUNT(*) as remaining_count
FROM public."Project"
WHERE "jobNumber" = '5932';

COMMIT;