#!/usr/bin/env tsx
import { Client } from 'pg';

async function fixInitializeFunction() {
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or DIRECT_URL must be set');
  }
  
  const url = new URL(databaseUrl);
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.substring(1),
    user: url.username,
    password: url.password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Drop the existing function and trigger
    await client.query('DROP TRIGGER IF EXISTS component_after_insert ON "Component"');
    await client.query('DROP FUNCTION IF EXISTS component_after_insert_trigger()');
    await client.query('DROP FUNCTION IF EXISTS initialize_component_milestones(uuid)');
    await client.query('DROP FUNCTION IF EXISTS initialize_component_milestones(text)');
    console.log('Dropped existing functions and triggers');
    
    // Create the initialize_component_milestones function with text parameter
    const functionSQL = `
CREATE OR REPLACE FUNCTION initialize_component_milestones(p_component_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_component record;
  v_template record;
  v_milestones jsonb;
  v_milestone jsonb;
  v_order int := 0;
BEGIN
  -- Get component and its template
  SELECT c.*, mt.milestones as template_milestones
  INTO v_component
  FROM "Component" c
  LEFT JOIN "MilestoneTemplate" mt ON c."milestoneTemplateId" = mt.id
  WHERE c.id = p_component_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Component not found: %', p_component_id;
  END IF;
  
  -- Only initialize if template exists and no milestones exist yet
  IF v_component.template_milestones IS NOT NULL THEN
    -- Check if milestones already exist
    IF NOT EXISTS (SELECT 1 FROM "ComponentMilestone" WHERE "componentId" = p_component_id) THEN
      v_milestones := v_component.template_milestones::jsonb;
      
      -- Create milestones from template
      FOR v_milestone IN SELECT * FROM jsonb_array_elements(v_milestones)
      LOOP
        INSERT INTO "ComponentMilestone" (
          id,
          "componentId",
          "milestoneOrder",
          "milestoneName",
          "isCompleted",
          "createdAt"
        ) VALUES (
          substr(md5(random()::text || clock_timestamp()::text), 1, 24), -- Generate cuid-like string
          p_component_id,
          v_order,
          v_milestone->>'name',
          false,
          NOW()
        );
        
        v_order := v_order + 1;
      END LOOP;
    END IF;
  END IF;
END;
$$;
    `;
    
    await client.query(functionSQL);
    console.log('Created initialize_component_milestones function with text parameter');
    
    // Create the trigger
    const triggerSQL = `
CREATE OR REPLACE FUNCTION component_after_insert_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM initialize_component_milestones(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER component_after_insert
  AFTER INSERT ON "Component"
  FOR EACH ROW
  EXECUTE FUNCTION component_after_insert_trigger();
    `;
    
    await client.query(triggerSQL);
    console.log('Created component_after_insert trigger');
    
    console.log('✅ Successfully fixed initialize_component_milestones function');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixInitializeFunction().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});