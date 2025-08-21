-- Create a stub function that does nothing
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