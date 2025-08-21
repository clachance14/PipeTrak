-- Drop the trigger that's causing issues
DROP TRIGGER IF EXISTS component_initialize_milestones ON component;

-- Drop the trigger function
DROP FUNCTION IF EXISTS trigger_initialize_milestones();

-- Create a stub function that does nothing
-- This allows components to be created without errors
CREATE OR REPLACE FUNCTION initialize_component_milestones(p_component_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Stub function that does nothing
  -- The seed script will handle milestone creation manually
  RETURN;
END;
$$;