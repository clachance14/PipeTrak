-- Create ProgressSnapshot table for storing weekly progress reports
-- This table must be created before the progress summary functions

-- Create the ProgressSnapshot table
CREATE TABLE IF NOT EXISTS "ProgressSnapshot" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "projectId" TEXT NOT NULL,
    "weekEnding" DATE NOT NULL,
    "snapshotData" JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRELIMINARY' CHECK (status IN ('PRELIMINARY', 'FINAL')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key to Project table
    CONSTRAINT fk_progress_snapshot_project
        FOREIGN KEY ("projectId") 
        REFERENCES "Project"(id) 
        ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_progress_snapshot_project 
    ON "ProgressSnapshot"("projectId");

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_week_ending 
    ON "ProgressSnapshot"("weekEnding");

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_status 
    ON "ProgressSnapshot"(status);

CREATE INDEX IF NOT EXISTS idx_progress_snapshot_composite 
    ON "ProgressSnapshot"("projectId", "weekEnding", status, "createdAt" DESC);

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_progress_snapshot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_progress_snapshot_timestamp
    BEFORE UPDATE ON "ProgressSnapshot"
    FOR EACH ROW
    EXECUTE FUNCTION update_progress_snapshot_updated_at();

-- Grant permissions
GRANT SELECT ON "ProgressSnapshot" TO authenticated;
GRANT INSERT ON "ProgressSnapshot" TO authenticated;
GRANT UPDATE ON "ProgressSnapshot" TO authenticated;
GRANT DELETE ON "ProgressSnapshot" TO service_role;

-- Add RLS policies
ALTER TABLE "ProgressSnapshot" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view snapshots for projects in their organization
CREATE POLICY "Users can view progress snapshots"
    ON "ProgressSnapshot"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM "Project" p
            WHERE p.id = "ProgressSnapshot"."projectId"
              AND p."organizationId" IN (
                  SELECT "organizationId"
                  FROM public.member
                  WHERE "userId" = auth.uid()::TEXT
              )
        )
    );

-- Policy: Users can create snapshots for projects in their organization
CREATE POLICY "Users can create progress snapshots"
    ON "ProgressSnapshot"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM "Project" p
            WHERE p.id = "ProgressSnapshot"."projectId"
              AND p."organizationId" IN (
                  SELECT "organizationId"
                  FROM public.member
                  WHERE "userId" = auth.uid()::TEXT
              )
        )
    );

-- Policy: Users can update snapshots for projects in their organization (before FINAL status)
CREATE POLICY "Users can update progress snapshots"
    ON "ProgressSnapshot"
    FOR UPDATE
    TO authenticated
    USING (
        status = 'PRELIMINARY' AND
        EXISTS (
            SELECT 1
            FROM "Project" p
            WHERE p.id = "ProgressSnapshot"."projectId"
              AND p."organizationId" IN (
                  SELECT "organizationId"
                  FROM public.member
                  WHERE "userId" = auth.uid()::TEXT
              )
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'ProgressSnapshot table created successfully!';
END;
$$;