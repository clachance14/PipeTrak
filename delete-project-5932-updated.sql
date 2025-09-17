-- Hard delete script for removing all data associated with project job number 5932
-- Run this script against the production database ONLY after taking the appropriate backups.
-- It removes the project row and every dependent record (components, welders, reports, etc.).

BEGIN;

DO $$
DECLARE
    target_job_number CONSTANT TEXT := '5932';
    project_record RECORD;
    deleted_count BIGINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public."Project" WHERE "jobNumber" = target_job_number
    ) THEN
        RAISE NOTICE 'No projects found with job number %.', target_job_number;
        RETURN;
    END IF;

    FOR project_record IN
        SELECT id,
               "jobName",
               "jobNumber",
               "organizationId"
        FROM public."Project"
        WHERE "jobNumber" = target_job_number
    LOOP
        RAISE NOTICE 'Deleting project % (job % / org % / name %).',
            project_record.id,
            project_record."jobNumber",
            project_record."organizationId",
            project_record."jobName";

        -- Remove audit logs first so they do not reference deleted components/milestones
        DELETE FROM public."AuditLog"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % audit log rows.', deleted_count;

        -- Delete milestone progress entries tied to this project's components
        DELETE FROM public."ComponentMilestone"
        WHERE "componentId" IN (
            SELECT id FROM public."Component" WHERE "projectId" = project_record.id
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % component milestone rows.', deleted_count;

        -- Delete field weld QC data BEFORE components because of weldIdNumber FK linkage
        DELETE FROM public."field_weld"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % field weld rows (by project).', deleted_count;

        -- Safety: delete any field welds still tied to components via weldIdNumber
        DELETE FROM public."field_weld"
        WHERE "weldIdNumber" IN (
            SELECT "weldId"
            FROM public."Component"
            WHERE "projectId" = project_record.id
              AND "weldId" IS NOT NULL
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % field weld rows (by weldIdNumber).', deleted_count;

        -- Delete components after field welds and milestones are gone
        DELETE FROM public."Component"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % component rows.', deleted_count;

        -- Delete welders that belonged to this project
        DELETE FROM public."welder"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % welder rows.', deleted_count;

        -- Break drawing hierarchy links before deleting drawings
        UPDATE public."Drawing"
        SET "parentId" = NULL
        WHERE "projectId" = project_record.id
          AND "parentId" IS NOT NULL;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Cleared % drawing parent links.', deleted_count;

        DELETE FROM public."Drawing"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % drawing rows.', deleted_count;

        -- Remove milestone templates after components are deleted
        DELETE FROM public."MilestoneTemplate"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % milestone template rows.', deleted_count;

        -- Remove import job history
        DELETE FROM public."ImportJob"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % import job rows.', deleted_count;

        -- Remove generated reports, caches, snapshots, and ROC configuration records
        DELETE FROM public."ReportGenerations"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % report generation rows.', deleted_count;

        DELETE FROM public."ProgressSnapshots"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % progress snapshot rows.', deleted_count;

        DELETE FROM public."ReportingCache"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % reporting cache rows.', deleted_count;

        DELETE FROM public."ROCConfigurations"
        WHERE "projectId" = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % ROC configuration rows.', deleted_count;

        -- Finally delete the project itself
        DELETE FROM public."Project"
        WHERE id = project_record.id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '  - Deleted % project rows.', deleted_count;
    END LOOP;
END $$ LANGUAGE plpgsql;

COMMIT;

-- Verification: confirm no projects remain with job number 5932
SELECT COUNT(*) AS remaining_projects
FROM public."Project"
WHERE "jobNumber" = '5932';
