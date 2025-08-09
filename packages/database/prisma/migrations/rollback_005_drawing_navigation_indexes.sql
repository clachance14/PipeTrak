-- Rollback script for Drawing Navigation Performance Indexes
-- Run this script to remove the indexes if needed

DROP INDEX IF EXISTS "idx_drawing_project_parent";
DROP INDEX IF EXISTS "idx_component_drawing_status";
DROP INDEX IF EXISTS "idx_drawing_search";
DROP INDEX IF EXISTS "idx_drawing_number";
DROP INDEX IF EXISTS "idx_component_drawing_type";