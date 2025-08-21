-- Disable the trigger that's causing issues
DROP TRIGGER IF EXISTS component_initialize_milestones ON component CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS trigger_initialize_milestones() CASCADE;

-- Drop the function that the trigger calls
DROP FUNCTION IF EXISTS initialize_component_milestones(text) CASCADE;