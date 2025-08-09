-- Drawing Navigation Performance Indexes
-- These indexes optimize the drawing hierarchy navigation feature

-- Composite index for efficient hierarchy traversal
CREATE INDEX IF NOT EXISTS "idx_drawing_project_parent" ON "Drawing" ("projectId", "parentId");

-- Index for component status filtering within drawings
CREATE INDEX IF NOT EXISTS "idx_component_drawing_status" ON "Component" ("drawingId", "status");

-- Full-text search index for drawing number and title
-- Note: This uses GIN index for PostgreSQL full-text search
CREATE INDEX IF NOT EXISTS "idx_drawing_search" ON "Drawing" USING GIN (
  to_tsvector('english', COALESCE("number", '') || ' ' || COALESCE("title", ''))
);

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_drawing_number" ON "Drawing" ("projectId", "number");
CREATE INDEX IF NOT EXISTS "idx_component_drawing_type" ON "Component" ("drawingId", "type");