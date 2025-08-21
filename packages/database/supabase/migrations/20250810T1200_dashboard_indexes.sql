-- Dashboard Performance Indexes
-- Migration: 20250810T1200_dashboard_indexes.sql
-- Purpose: Add optimized indexes for dashboard aggregations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Composite index for area/system matrix queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_project_area_system
ON "Component" ("projectId", "area", "system") 
WHERE "area" IS NOT NULL AND "system" IS NOT NULL;

-- 2. Test package completion index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_project_test_package_completion
ON "Component" ("projectId", "testPackage", "completionPercent") 
WHERE "testPackage" IS NOT NULL;

-- 3. Component status aggregation index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_project_status_completion
ON "Component" ("projectId", "status", "completionPercent");

-- 4. Drawing progress aggregation index  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_drawing_completion
ON "Component" ("drawingId", "completionPercent", "status")
WHERE "drawingId" IS NOT NULL;

-- 5. Milestone completion tracking for stalled components
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_component_milestone_recent_completion
ON "ComponentMilestone" ("componentId", "completedAt" DESC NULLS LAST, "isCompleted");

-- 6. Audit log for recent activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_project_recent_activity
ON "AuditLog" ("projectId", "timestamp" DESC, "entityType")
WHERE "entityType" = 'Component' OR "entityType" = 'ComponentMilestone';

-- 7. Drawing hierarchy index for rollup calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawing_project_parent
ON "Drawing" ("projectId", "parentId");

-- Comments for documentation
COMMENT ON INDEX idx_component_project_area_system IS 'Optimizes area/system matrix aggregations for dashboard';
COMMENT ON INDEX idx_component_project_test_package_completion IS 'Optimizes test package readiness calculations';
COMMENT ON INDEX idx_component_project_status_completion IS 'Optimizes overall project metrics calculations';
COMMENT ON INDEX idx_component_drawing_completion IS 'Optimizes drawing-level progress rollups';
COMMENT ON INDEX idx_component_milestone_recent_completion IS 'Optimizes stalled component detection based on milestone progress';
COMMENT ON INDEX idx_audit_log_project_recent_activity IS 'Optimizes recent activity feed queries';
COMMENT ON INDEX idx_drawing_project_parent IS 'Optimizes drawing hierarchy traversal for rollup calculations';