# Paint & Insulation Database Design Specification

## Overview

This document defines the complete database schema changes required to implement specification-driven Paint and Insulation tracking as separate subcontractor scopes in PipeTrak.

**Key Principles:**
- Specification-driven: Only track components with valid paint/insulation specs
- Scope separation: Independent progress tracking for each discipline
- Performance-first: Optimized indexes for large-scale operations
- Backward compatibility: Existing data and workflows remain unaffected

## Schema Changes

### 1. Component Model Updates

**Add specification fields to existing Component table:**

```prisma
model Component {
  // ... existing fields ...
  
  // NEW: Specification-based tracking fields
  paintSpec         String?  // Paint specification code (e.g., "EP-100", null/empty/"NONE" = not required)
  insulationSpec    String?  // Insulation specification code (e.g., "51P11C", null/empty/"NONE" = not required)
  
  // NEW: Relations to progress tracking
  paintProgress     PaintProgress?
  insulationProgress InsulationProgress?
  
  // ... existing relations ...
  
  // NEW: Indexes for specification filtering
  @@index([projectId, paintSpec], name: "idx_component_paint_spec")
  @@index([projectId, insulationSpec], name: "idx_component_insulation_spec")  
  @@index([projectId, paintSpec, insulationSpec], name: "idx_component_both_specs")
}
```

**Migration SQL:**
```sql
-- Migration: 001_add_component_specifications.sql
ALTER TABLE "Component" 
ADD COLUMN "paintSpec" TEXT,
ADD COLUMN "insulationSpec" TEXT;

-- Create indexes for performance
CREATE INDEX "idx_component_paint_spec" ON "Component"("projectId", "paintSpec");
CREATE INDEX "idx_component_insulation_spec" ON "Component"("projectId", "insulationSpec");
CREATE INDEX "idx_component_both_specs" ON "Component"("projectId", "paintSpec", "insulationSpec");

-- Update existing components to null (no change in behavior)
-- Components will be updated via import or manual specification assignment
```

### 2. Paint Progress Tracking Table

**New table for independent paint progress tracking:**

```prisma
model PaintProgress {
  id                String   @id @default(cuid())
  componentId       String   @unique
  component         Component @relation(fields: [componentId], references: [id], onDelete: Cascade)
  
  // Specification details
  paintSpec         String   // The paint specification being applied (copied from Component for performance)
  
  // Two-milestone progress tracking
  primerComplete    Boolean  @default(false) // 40% of paint progress
  finishCoatComplete Boolean @default(false) // 60% of paint progress
  completionPercent Float    @default(0)     // Calculated: 0, 40, 100
  
  // Subcontractor management
  subcontractor     String?  // Assigned subcontractor company
  assignedTo        String?  // Specific crew/person
  
  // Progress tracking
  primerCompletedAt    DateTime?
  primerCompletedBy    String?
  finishCoatCompletedAt DateTime?
  finishCoatCompletedBy String?
  
  // Audit fields
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Performance indexes
  @@index([component.projectId], name: "idx_paint_progress_project")
  @@index([component.projectId, completionPercent], name: "idx_paint_progress_completion")
  @@index([component.projectId, subcontractor], name: "idx_paint_progress_subcontractor")
  @@index([paintSpec], name: "idx_paint_progress_spec")
}
```

**Migration SQL:**
```sql
-- Migration: 002_create_paint_progress.sql
CREATE TABLE "PaintProgress" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "componentId" TEXT NOT NULL UNIQUE REFERENCES "Component"(id) ON DELETE CASCADE,
    "paintSpec" TEXT NOT NULL,
    "primerComplete" BOOLEAN DEFAULT false,
    "finishCoatComplete" BOOLEAN DEFAULT false,
    "completionPercent" REAL DEFAULT 0,
    "subcontractor" TEXT,
    "assignedTo" TEXT,
    "primerCompletedAt" TIMESTAMP,
    "primerCompletedBy" TEXT,
    "finishCoatCompletedAt" TIMESTAMP,
    "finishCoatCompletedBy" TEXT,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- Create performance indexes
CREATE INDEX "idx_paint_progress_project" ON "PaintProgress"("componentId");
CREATE INDEX "idx_paint_progress_spec" ON "PaintProgress"("paintSpec");

-- Create trigger to update completionPercent automatically
CREATE OR REPLACE FUNCTION update_paint_completion_percent()
RETURNS TRIGGER AS $$
BEGIN
    NEW."completionPercent" := 
        CASE 
            WHEN NEW."finishCoatComplete" THEN 100
            WHEN NEW."primerComplete" THEN 40
            ELSE 0
        END;
    NEW."updatedAt" := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER paint_progress_completion_trigger
    BEFORE INSERT OR UPDATE ON "PaintProgress"
    FOR EACH ROW
    EXECUTE FUNCTION update_paint_completion_percent();
```

### 3. Insulation Progress Tracking Table

**New table for independent insulation progress tracking:**

```prisma
model InsulationProgress {
  id                  String   @id @default(cuid())
  componentId         String   @unique
  component           Component @relation(fields: [componentId], references: [id], onDelete: Cascade)
  
  // Specification details
  insulationSpec      String   // The insulation specification being applied (copied from Component for performance)
  
  // Two-milestone progress tracking
  insulateComplete    Boolean  @default(false) // 60% of insulation progress
  metalOutComplete    Boolean  @default(false) // 40% of insulation progress
  completionPercent   Float    @default(0)     // Calculated: 0, 60, 100
  
  // Subcontractor management
  subcontractor       String?  // Assigned subcontractor company
  assignedTo          String?  // Specific crew/person
  
  // Progress tracking
  insulateCompletedAt    DateTime?
  insulateCompletedBy    String?
  metalOutCompletedAt    DateTime?
  metalOutCompletedBy    String?
  
  // Audit fields
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Performance indexes
  @@index([component.projectId], name: "idx_insulation_progress_project")
  @@index([component.projectId, completionPercent], name: "idx_insulation_progress_completion")
  @@index([component.projectId, subcontractor], name: "idx_insulation_progress_subcontractor")
  @@index([insulationSpec], name: "idx_insulation_progress_spec")
}
```

**Migration SQL:**
```sql
-- Migration: 003_create_insulation_progress.sql
CREATE TABLE "InsulationProgress" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "componentId" TEXT NOT NULL UNIQUE REFERENCES "Component"(id) ON DELETE CASCADE,
    "insulationSpec" TEXT NOT NULL,
    "insulateComplete" BOOLEAN DEFAULT false,
    "metalOutComplete" BOOLEAN DEFAULT false,
    "completionPercent" REAL DEFAULT 0,
    "subcontractor" TEXT,
    "assignedTo" TEXT,
    "insulateCompletedAt" TIMESTAMP,
    "insulateCompletedBy" TEXT,
    "metalOutCompletedAt" TIMESTAMP,
    "metalOutCompletedBy" TEXT,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- Create performance indexes
CREATE INDEX "idx_insulation_progress_project" ON "InsulationProgress"("componentId");
CREATE INDEX "idx_insulation_progress_spec" ON "InsulationProgress"("insulationSpec");

-- Create trigger to update completionPercent automatically
CREATE OR REPLACE FUNCTION update_insulation_completion_percent()
RETURNS TRIGGER AS $$
BEGIN
    NEW."completionPercent" := 
        CASE 
            WHEN NEW."metalOutComplete" THEN 100
            WHEN NEW."insulateComplete" THEN 60
            ELSE 0
        END;
    NEW."updatedAt" := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insulation_progress_completion_trigger
    BEFORE INSERT OR UPDATE ON "InsulationProgress"
    FOR EACH ROW
    EXECUTE FUNCTION update_insulation_completion_percent();
```

### 4. Progress Snapshots Updates

**Extend existing ProgressSnapshots to track multiple scopes:**

```prisma
model ProgressSnapshots {
  // ... existing fields ...
  
  // NEW: Separate scope progress metrics
  pipingCompletionPercent     Decimal @default(0.00) @db.Decimal(5,2) // Existing ROC calculation
  paintCompletionPercent      Decimal @default(0.00) @db.Decimal(5,2) // Paint scope percentage
  insulationCompletionPercent Decimal @default(0.00) @db.Decimal(5,2) // Insulation scope percentage
  
  // NEW: Component counts by scope
  pipingComponentCount        Int @default(0) // All components (existing)
  paintRequiredCount          Int @default(0) // Components with valid paintSpec
  paintCompletedCount         Int @default(0) // Paint progress = 100%
  insulationRequiredCount     Int @default(0) // Components with valid insulationSpec
  insulationCompletedCount    Int @default(0) // Insulation progress = 100%
  
  // NEW: Overall turnover calculation
  turnoverReadyPercent        Decimal @default(0.00) @db.Decimal(5,2) // Weighted average of all applicable scopes
  scopeWeights                Json    @default("{\"piping\": 70, \"paint\": 15, \"insulation\": 15}") /// @zod.custom.use(z.object({ piping: z.number(), paint: z.number(), insulation: z.number() }))
}
```

**Migration SQL:**
```sql
-- Migration: 004_update_progress_snapshots.sql
ALTER TABLE "ProgressSnapshots" 
ADD COLUMN "pipingCompletionPercent" DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN "paintCompletionPercent" DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN "insulationCompletionPercent" DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN "paintRequiredCount" INTEGER DEFAULT 0,
ADD COLUMN "paintCompletedCount" INTEGER DEFAULT 0,
ADD COLUMN "insulationRequiredCount" INTEGER DEFAULT 0,
ADD COLUMN "insulationCompletedCount" INTEGER DEFAULT 0,
ADD COLUMN "turnoverReadyPercent" DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN "scopeWeights" JSONB DEFAULT '{"piping": 70, "paint": 15, "insulation": 15}';

-- Migrate existing data
UPDATE "ProgressSnapshots" 
SET "pipingCompletionPercent" = "overallCompletionPercent"
WHERE "pipingCompletionPercent" = 0;

-- Create index for scope-based queries
CREATE INDEX "idx_progress_snapshots_scopes" ON "ProgressSnapshots"("projectId", "snapshotDate", "pipingCompletionPercent", "paintCompletionPercent", "insulationCompletionPercent");
```

### 5. Reporting Cache Updates

**Extend ReportingCache for multi-scope caching:**

```prisma
model ReportingCache {
  // ... existing fields ...
  
  // NEW: Scope-specific cache keys and data
  scopeType           String?  // 'piping', 'paint', 'insulation', 'turnover', null for legacy
  scopeBreakdown      Json?    /// @zod.custom.use(z.record(z.any())) // Scope-specific breakdown data
  
  // NEW: Indexes for scope-based caching
  @@index([projectId, reportType, scopeType], name: "idx_reporting_cache_scope")
}
```

## Database Functions and Views

### 1. Progress Calculation Functions

**Multi-scope progress calculation RPC:**

```sql
-- Function: calculate_project_progress.sql
CREATE OR REPLACE FUNCTION calculate_project_progress(project_id TEXT)
RETURNS JSON AS $$
DECLARE
    piping_progress DECIMAL;
    paint_progress DECIMAL;
    insulation_progress DECIMAL;
    turnover_progress DECIMAL;
    scope_weights JSON;
    result JSON;
BEGIN
    -- Calculate piping progress (existing ROC logic)
    SELECT COALESCE(AVG(c."completionPercent"), 0)
    INTO piping_progress
    FROM "Component" c
    WHERE c."projectId" = project_id;
    
    -- Calculate paint progress
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN NULL
            ELSE (COUNT(*) FILTER (WHERE pp."completionPercent" = 100) * 100.0 / COUNT(*))
        END
    INTO paint_progress
    FROM "Component" c
    LEFT JOIN "PaintProgress" pp ON c.id = pp."componentId"
    WHERE c."projectId" = project_id 
    AND c."paintSpec" IS NOT NULL 
    AND c."paintSpec" != '' 
    AND c."paintSpec" != 'NONE';
    
    -- Calculate insulation progress
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN NULL
            ELSE (COUNT(*) FILTER (WHERE ip."completionPercent" = 100) * 100.0 / COUNT(*))
        END
    INTO insulation_progress
    FROM "Component" c
    LEFT JOIN "InsulationProgress" ip ON c.id = ip."componentId"
    WHERE c."projectId" = project_id 
    AND c."insulationSpec" IS NOT NULL 
    AND c."insulationSpec" != '' 
    AND c."insulationSpec" != 'NONE';
    
    -- Get scope weights (could be project-specific in future)
    scope_weights := '{"piping": 70, "paint": 15, "insulation": 15}';
    
    -- Calculate turnover readiness (weighted average of applicable scopes)
    SELECT 
        CASE 
            WHEN paint_progress IS NULL AND insulation_progress IS NULL THEN piping_progress
            WHEN paint_progress IS NULL THEN 
                (piping_progress * 85 + insulation_progress * 15) / 100
            WHEN insulation_progress IS NULL THEN 
                (piping_progress * 85 + paint_progress * 15) / 100
            ELSE 
                (piping_progress * 70 + paint_progress * 15 + insulation_progress * 15) / 100
        END
    INTO turnover_progress;
    
    -- Build result JSON
    result := json_build_object(
        'pipingProgress', piping_progress,
        'paintProgress', paint_progress,
        'insulationProgress', insulation_progress,
        'turnoverProgress', turnover_progress,
        'scopeWeights', scope_weights,
        'calculatedAt', now()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 2. Component Scope Views

**Create materialized view for fast scope queries:**

```sql
-- View: component_scope_summary.sql
CREATE MATERIALIZED VIEW component_scope_summary AS
SELECT 
    c."projectId",
    c.id as "componentId",
    c."componentId" as "businessId",
    c."displayId",
    c.type,
    c.area,
    c.system,
    
    -- Scope requirements
    (c."paintSpec" IS NOT NULL AND c."paintSpec" != '' AND c."paintSpec" != 'NONE') as "requiresPaint",
    (c."insulationSpec" IS NOT NULL AND c."insulationSpec" != '' AND c."insulationSpec" != 'NONE') as "requiresInsulation",
    c."paintSpec",
    c."insulationSpec",
    
    -- Progress by scope
    c."completionPercent" as "pipingProgress",
    COALESCE(pp."completionPercent", 0) as "paintProgress",
    COALESCE(ip."completionPercent", 0) as "insulationProgress",
    
    -- Overall readiness
    CASE 
        WHEN (c."paintSpec" IS NULL OR c."paintSpec" = '' OR c."paintSpec" = 'NONE') 
         AND (c."insulationSpec" IS NULL OR c."insulationSpec" = '' OR c."insulationSpec" = 'NONE')
        THEN c."completionPercent"
        
        WHEN (c."paintSpec" IS NULL OR c."paintSpec" = '' OR c."paintSpec" = 'NONE')
        THEN CASE WHEN c."completionPercent" = 100 AND COALESCE(ip."completionPercent", 0) = 100 THEN 100 ELSE 0 END
        
        WHEN (c."insulationSpec" IS NULL OR c."insulationSpec" = '' OR c."insulationSpec" = 'NONE')
        THEN CASE WHEN c."completionPercent" = 100 AND COALESCE(pp."completionPercent", 0) = 100 THEN 100 ELSE 0 END
        
        ELSE CASE WHEN c."completionPercent" = 100 AND COALESCE(pp."completionPercent", 0) = 100 AND COALESCE(ip."completionPercent", 0) = 100 THEN 100 ELSE 0 END
    END as "overallComplete",
    
    -- Subcontractor assignments
    pp.subcontractor as "paintSubcontractor",
    ip.subcontractor as "insulationSubcontractor"
    
FROM "Component" c
LEFT JOIN "PaintProgress" pp ON c.id = pp."componentId"
LEFT JOIN "InsulationProgress" ip ON c.id = ip."componentId";

-- Create unique index for fast lookups
CREATE UNIQUE INDEX "idx_component_scope_summary_id" ON component_scope_summary("componentId");
CREATE INDEX "idx_component_scope_summary_project" ON component_scope_summary("projectId");
CREATE INDEX "idx_component_scope_summary_requirements" ON component_scope_summary("projectId", "requiresPaint", "requiresInsulation");

-- Refresh strategy (could be automated with triggers)
CREATE OR REPLACE FUNCTION refresh_component_scope_summary()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY component_scope_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimization

### Index Strategy

**Primary indexes for query performance:**

```sql
-- Component table indexes (added to existing)
CREATE INDEX "idx_component_paint_required" ON "Component"("projectId") 
WHERE "paintSpec" IS NOT NULL AND "paintSpec" != '' AND "paintSpec" != 'NONE';

CREATE INDEX "idx_component_insulation_required" ON "Component"("projectId") 
WHERE "insulationSpec" IS NOT NULL AND "insulationSpec" != '' AND "insulationSpec" != 'NONE';

-- Progress table indexes for subcontractor queries
CREATE INDEX "idx_paint_progress_subcontractor_incomplete" ON "PaintProgress"("subcontractor", "completionPercent") 
WHERE "completionPercent" < 100;

CREATE INDEX "idx_insulation_progress_subcontractor_incomplete" ON "InsulationProgress"("subcontractor", "completionPercent") 
WHERE "completionPercent" < 100;

-- Composite indexes for dashboard queries
CREATE INDEX "idx_progress_dashboard_composite" ON "Component"("projectId", "area", "system", "completionPercent");
```

### Query Optimization

**Prepared statements for common queries:**

```sql
-- Get project progress summary
PREPARE project_progress_summary(TEXT) AS
SELECT 
    COUNT(*) as total_components,
    COUNT(*) FILTER (WHERE "completionPercent" = 100) as piping_complete,
    COUNT(*) FILTER (WHERE "paintSpec" IS NOT NULL AND "paintSpec" != '' AND "paintSpec" != 'NONE') as paint_required,
    COUNT(pp.*) FILTER (WHERE pp."completionPercent" = 100) as paint_complete,
    COUNT(*) FILTER (WHERE "insulationSpec" IS NOT NULL AND "insulationSpec" != '' AND "insulationSpec" != 'NONE') as insulation_required,
    COUNT(ip.*) FILTER (WHERE ip."completionPercent" = 100) as insulation_complete
FROM "Component" c
LEFT JOIN "PaintProgress" pp ON c.id = pp."componentId"
LEFT JOIN "InsulationProgress" ip ON c.id = ip."componentId"
WHERE c."projectId" = $1;

-- Get subcontractor workload
PREPARE subcontractor_workload(TEXT, TEXT) AS
SELECT 
    c."area",
    c."system", 
    COUNT(*) as total_components,
    COUNT(*) FILTER (WHERE pp."completionPercent" = 100) as completed,
    AVG(pp."completionPercent") as avg_progress
FROM "Component" c
JOIN "PaintProgress" pp ON c.id = pp."componentId"
WHERE c."projectId" = $1 AND pp.subcontractor = $2
GROUP BY c."area", c."system"
ORDER BY avg_progress ASC;
```

## Data Migration Strategy

### Phase 1: Schema Changes
1. Add specification columns to Component table
2. Create PaintProgress and InsulationProgress tables
3. Update ProgressSnapshots schema
4. Deploy database functions and views

### Phase 2: Data Population
1. Import specifications from existing data sources
2. Create progress records for components with valid specifications
3. Update existing progress snapshots with scope-specific data
4. Validate data integrity

### Phase 3: Index Optimization
1. Create performance indexes based on usage patterns
2. Refresh materialized views
3. Update query plans and prepared statements
4. Monitor query performance

### Rollback Procedures

**Emergency rollback plan:**

```sql
-- Rollback script: rollback_paint_insulation_schema.sql
-- Run in reverse order of migrations

-- Drop new tables
DROP TABLE IF EXISTS "InsulationProgress";
DROP TABLE IF EXISTS "PaintProgress";

-- Remove columns from ProgressSnapshots
ALTER TABLE "ProgressSnapshots" 
DROP COLUMN IF EXISTS "pipingCompletionPercent",
DROP COLUMN IF EXISTS "paintCompletionPercent",
DROP COLUMN IF EXISTS "insulationCompletionPercent",
DROP COLUMN IF EXISTS "paintRequiredCount",
DROP COLUMN IF EXISTS "paintCompletedCount",
DROP COLUMN IF EXISTS "insulationRequiredCount",
DROP COLUMN IF EXISTS "insulationCompletedCount",
DROP COLUMN IF EXISTS "turnoverReadyPercent",
DROP COLUMN IF EXISTS "scopeWeights";

-- Remove columns from Component
ALTER TABLE "Component" 
DROP COLUMN IF EXISTS "paintSpec",
DROP COLUMN IF EXISTS "insulationSpec";

-- Drop functions and views
DROP FUNCTION IF EXISTS calculate_project_progress(TEXT);
DROP MATERIALIZED VIEW IF EXISTS component_scope_summary;
```

---

*Document Version: 1.0*  
*Author: Database Architect*  
*Date: 2025-08-14*  
*Status: Implementation Ready*  
*Performance Target: Handle 100K components with sub-second query response*