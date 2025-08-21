-- Drop PipeTrak tables in correct order to handle foreign key dependencies
-- This script safely removes the lowercase tables so Prisma can create PascalCase ones

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS import_job CASCADE;
DROP TABLE IF EXISTS component_milestone CASCADE;
DROP TABLE IF EXISTS component CASCADE;
DROP TABLE IF EXISTS milestone_template CASCADE;
DROP TABLE IF EXISTS drawing CASCADE;
DROP TABLE IF EXISTS project CASCADE;

-- Verify tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('project', 'drawing', 'milestone_template', 'component', 'component_milestone', 'import_job', 'audit_log');